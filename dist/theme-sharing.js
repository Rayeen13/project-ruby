import {validateThemePrism,parseThemePrism} from './theme-prisms.js';

// Portable data contracts shared by browser and desktop. No marketplace or OS IO.
export function serializeThemePrism(theme){
 const source=JSON.stringify(validateThemePrism(theme),null,2)+'\n';
 parseThemePrism(source);return source;
}
export function prepareThemeListing(theme,{description,price,currency,rightsConfirmed}={}){
 const checked=parseThemePrism(serializeThemePrism(theme));
 if(rightsConfirmed!==true)throw Error('Confirm that you may distribute and sell this theme.');
 if(typeof description!=='string'||!description.trim()||description.length>1200)throw Error('Add a description under 1,200 characters.');
 if(typeof price!=='string'||!/^\d{1,6}(?:\.\d{1,2})?$/.test(price))throw Error('Enter a price with at most two decimal places.');
 if(!['USD','INR','EUR','GBP','JPY'].includes(currency))throw Error('Choose a supported listing currency.');
 if(currency==='JPY'&&Number(price)%1!==0)throw Error('JPY prices use whole yen.');
 return {format:'prismy-shop-draft',version:1,status:'unpublished',listing:{title:checked.name,description:description.trim(),creator:checked.author,license:checked.license,price:{amount:price,currency},rightsDeclaration:true},theme:checked};
}
