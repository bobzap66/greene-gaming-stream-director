// Hybrid stays tactical unless an eligible public action is being held.
export function combatStyleShot(style,initiativeShot,tacticalPoints,actionPoints){
 if(style==="tactical"||initiativeShot.kind!=="cinematic")return {kind:"tactical",points:tacticalPoints};
 if(actionPoints?.length)return {kind:"cinematic",points:actionPoints};
 return style==="hybrid"?{kind:"tactical",points:tacticalPoints}:initiativeShot;
}
export const directorMacroCommand='game.modules.get("greene-gaming-stream-director")?.api?.openDirector();';
