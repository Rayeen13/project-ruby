"""Build static, connected millimetre STL figurines from the procedural models.
Requires trimesh, manifold3d, numpy and scipy. No animated rig in STL.
"""
import os, json, pathlib, numpy as np, trimesh, manifold3d
from scipy.spatial import cKDTree
OUT=pathlib.Path(__file__).resolve().parents[1]/'dist'/'prints'

def cap_boundaries(m):
    edges=m.edges_sorted
    unique,counts=np.unique(edges,axis=0,return_counts=True)
    boundary=unique[counts==1]
    if not len(boundary):return m
    adj={}
    for a,b in boundary:adj.setdefault(int(a),[]).append(int(b));adj.setdefault(int(b),[]).append(int(a))
    remaining=set(adj);vertices=m.vertices.tolist();faces=m.faces.tolist()
    while remaining:
        start=next(iter(remaining));loop=[start];previous=-1;current=start
        while True:
            options=[n for n in adj[current] if n!=previous]
            if not options:raise ValueError('Broken boundary')
            nxt=options[0]
            if nxt==start:break
            if nxt in loop:raise ValueError('Non-simple boundary')
            loop.append(nxt);previous,current=current,nxt
        remaining.difference_update(loop)
        points=m.vertices[loop];center=points.mean(axis=0)
        # Open-ended tube profiles must be planar before capping.
        assert np.linalg.svd(points-center,compute_uv=False)[-1]<1e-5
        index=len(vertices);vertices.append(center.tolist())
        faces.extend([[loop[i],loop[(i+1)%len(loop)],index] for i in range(len(loop))])
    m=trimesh.Trimesh(vertices=vertices,faces=faces,process=True);m.fix_normals();return m

def rod(a,b,r=1.2):
    a,b=np.asarray(a),np.asarray(b);v=b-a;length=np.linalg.norm(v)
    if length<1e-6:return trimesh.creation.icosphere(subdivisions=2,radius=r).apply_translation(a)
    transform=trimesh.geometry.align_vectors([0,0,1],v/length);transform[:3,3]=(a+b)/2
    return trimesh.creation.cylinder(radius=r,height=length+2*r,sections=16,transform=transform)

def printable_remesh(original):
    from scipy.ndimage import gaussian_filter
    from skimage.measure import marching_cubes
    voxels=original.voxelized(pitch=.5).fill()
    # Smooth the scalar field before extraction to avoid diagonal point contacts.
    field=np.pad(voxels.matrix.astype(np.float32),2)
    field=gaussian_filter(field,.6)
    vertices,faces,_,_=marching_cubes(field,level=.5,allow_degenerate=False)
    result=trimesh.Trimesh(vertices=vertices-2,faces=faces,process=True)
    result.apply_transform(voxels.transform);result.fix_normals()
    return result

reports=[]
for id in ([os.environ['RUBY_PRINT_MODEL']] if os.environ.get('RUBY_PRINT_MODEL') else ['classic','cyber','chibi','office','gamer','opal']):
    data=json.loads(pathlib.Path(f'/tmp/print-{id}.json').read_text());parts=[]
    for i,p in enumerate(data['parts']):
        m=trimesh.Trimesh(vertices=np.array(p['vertices']).reshape(-1,3),faces=np.array(p['faces']).reshape(-1,3),process=True)
        m.update_faces(m.nondegenerate_faces());m.remove_unreferenced_vertices();m.merge_vertices();m=cap_boundaries(m);m.fix_normals()
        if not m.is_volume:raise ValueError(f'{id} part {i} {p["type"]} not solid')
        parts.append(m)
    bounds=np.array([m.bounds for m in parts]);low=bounds[:,0].min(axis=0);high=bounds[:,1].max(axis=0)
    scale=120/(high[1]-low[1])
    # Y-up renderer -> Z-up printer, lifted onto a 3 mm base.
    for m in parts:
        v=m.vertices.copy();m.vertices=np.column_stack([v[:,0]*scale,-v[:,2]*scale,(v[:,1]-low[1])*scale+3])
    print(id,'union',len(parts),'parts',flush=True)
    model=trimesh.boolean.union(parts,engine='manifold')
    # Weld detached decorative components with short material bridges.
    bridges=0
    while True:
        components=sorted(model.split(),key=lambda c:c.volume,reverse=True)
        if len(components)==1:break
        main=components[0];tree=cKDTree(main.vertices);best=None
        for c in components[1:]:
            d,ix=tree.query(c.vertices);j=d.argmin()
            if best is None or d[j]<best[0]:best=(d[j],main.vertices[ix[j]],c.vertices[j])
        model=trimesh.boolean.union([model,rod(best[1],best[2])],engine='manifold');bridges+=1
        if bridges>50:raise ValueError('Too many disconnected components')
    b=model.bounds;radius=max(abs(b[:,0]).max(),abs(b[:,1]).max())+4
    base=trimesh.creation.cylinder(radius=radius,height=3,sections=96);base.apply_translation([0,0,1.5])
    # Connect each sole to the base with a slight vertical overlap.
    soles=model.vertices[model.vertices[:,2]<3.3]
    connectors=[rod([p[0],p[1],2.7],p,1.5) for p in [soles[soles[:,0].argmin()],soles[soles[:,0].argmax()]]]
    model=trimesh.boolean.union([model,base,*connectors],engine='manifold')
    assert model.is_watertight and model.is_winding_consistent and model.is_volume
    assert len(model.split())==1
    original=model.copy()
    solid=manifold3d.Manifold(manifold3d.Mesh(np.asarray(model.vertices,dtype=np.float32),np.asarray(model.faces,dtype=np.uint32)))
    print(id,'manifold status',solid.status(),flush=True)
    solid=solid.as_original().simplify(.1)
    mesh=solid.to_mesh();model=trimesh.Trimesh(vertices=mesh.vert_properties[:,:3],faces=mesh.tri_verts,process=True)
    print(id,'post simplify',model.is_watertight,model.is_volume,len(model.faces),flush=True)
    if not model.is_watertight or not model.is_volume:
        # A failed simplification must not replace the already validated solid.
        model=original.copy()
        print(id,'retained original validated solid',flush=True)
    assert model.is_watertight and model.is_volume
    path=OUT/f'{id}-120mm.stl';model.export(path)
    check=trimesh.load_mesh(path,process=True)
    if not check.is_watertight or not check.is_volume or len(check.split())!=1:
        model=printable_remesh(original)
        model.export(path);check=trimesh.load_mesh(path,process=True)
        print(id,'STL precision repair at 0.5 mm',flush=True)
    assert check.is_watertight and check.is_volume and len(check.split())==1
    report={'model':id,'file':path.name,'units':'mm','character_height_mm':120,'base_mm':3,'dimensions_mm':np.round(check.extents,2).tolist(),'triangles':len(check.faces),'watertight':bool(check.is_watertight),'connected_components':1,'positive_volume':bool(check.is_volume),'reinforcement_bridges':bridges}
    reports.append(report);print(report,flush=True)
if os.environ.get('RUBY_PRINT_MODEL'):
    existing=json.loads((OUT/'validation.json').read_text())
    reports=[r for r in existing if r['model']!=os.environ['RUBY_PRINT_MODEL']]+reports
(OUT/'validation.json').write_text(json.dumps(reports,indent=2))
