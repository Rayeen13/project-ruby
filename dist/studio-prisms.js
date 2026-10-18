import {createPrismHost} from './prism-host.js';
import {mountStudioAppearance} from './studio-appearance.js';
import {ThemePrismStore} from './theme-prisms.js';
import {mountPrismManager} from './prism-manager.js';
import {mountThemeCreator} from './theme-creator.js';
// Composition root. Runtime code is bundled and trusted; user theme Prisms are
// validated data, never downloaded/evaluated JavaScript or native executables.
export function createStudioPrisms(context,{appearance=mountStudioAppearance,themeLibrary=mountPrismManager,themeCreator=mountThemeCreator}={}){
 const host=createPrismHost({...context,themePrisms:new ThemePrismStore(context.storage)});
 host.register({id:'prismy.appearance',version:'1.0.0',requires:[],mount:appearance});
 host.register({id:'prismy.theme-library',version:'1.0.0',requires:['prismy.appearance'],mount:(environment,dependencies)=>themeLibrary(environment,dependencies['prismy.appearance'])});
 host.register({id:'prismy.theme-creator',version:'1.0.0',requires:['prismy.theme-library'],mount:(environment,dependencies)=>themeCreator(environment,dependencies['prismy.theme-library'])});
 return host;
}
