/** Parse exactly twelve operator-created Discord role IDs; never create/manipulate arbitrary role IDs. */
export function parseColorRoleIds(input:string):string[]{
 if(!input.trim())throw Error('COLOR_ROLES_NOT_CONFIGURED');
 const ids=input.split(',').map(s=>s.trim());
 if(ids.length!==12||new Set(ids).size!==12||ids.some(id=>!/^\d{15,22}$/.test(id)))throw Error('INVALID_COLOR_ROLE_MAP');
 return ids;
}
