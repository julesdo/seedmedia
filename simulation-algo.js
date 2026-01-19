// Simulation de l'algorithme de trading

console.log('=== SIMULATION 1 : État Initial (avec getEffectiveSlope) ===\n');

const slope = 0.01;
const ghostSupply = 5000;
const realSupply = 0;
const totalSupply = ghostSupply + realSupply;
const basePrice = slope * totalSupply;

console.log('Paramètres initiaux:');
console.log('  slope:', slope);
console.log('  ghostSupply:', ghostSupply);
console.log('  realSupply:', realSupply);
console.log('  totalSupply:', totalSupply);
console.log('  basePrice (slope × totalSupply):', basePrice);
console.log('');

// Calcul getEffectiveSlope
const liquidityRatio = realSupply / totalSupply;
const minRatio = 0.3;
const maxRatio = 1.0;
const liquidityFactor = minRatio + (maxRatio - minRatio) * Math.sqrt(liquidityRatio);

console.log('Calcul getEffectiveSlope:');
console.log('  liquidityRatio:', liquidityRatio);
console.log('  liquidityFactor:', liquidityFactor.toFixed(4));

const probability = basePrice / 100;
const probabilityFactor = probability > 0.5 ? Math.max(0.1, 1 - (probability - 0.5) * 0.8) : 1.0;

console.log('  probability:', probability);
console.log('  probabilityFactor:', probabilityFactor);
console.log('');

const effectiveSlope = slope * liquidityFactor * probabilityFactor;
const realPrice = effectiveSlope * totalSupply;

console.log('Résultat:');
console.log('  effectiveSlope:', effectiveSlope);
console.log('  realPrice (effectiveSlope × totalSupply):', realPrice);
console.log('  ❌ PROBLÈME : Prix devrait être 50, mais est', realPrice);
console.log('');

// ============================================

console.log('=== SIMULATION 2 : Achat OUI (avec getEffectiveSlope) ===\n');

let realSupply2 = 0;
let reserve2 = 0;

for (let i = 0; i < 3; i++) {
  const totalSupply2 = ghostSupply + realSupply2;
  const basePrice2 = slope * totalSupply2;
  const liquidityRatio2 = realSupply2 / totalSupply2;
  const liquidityFactor2 = 0.3 + 0.7 * Math.sqrt(liquidityRatio2);
  const probability2 = basePrice2 / 100;
  const probabilityFactor2 = probability2 > 0.5 ? Math.max(0.1, 1 - (probability2 - 0.5) * 0.8) : 1.0;
  const effectiveSlope2 = slope * liquidityFactor2 * probabilityFactor2;
  const realPrice2 = effectiveSlope2 * totalSupply2;
  
  const shares = 1000;
  const newRealSupply2 = realSupply2 + shares;
  const newTotalSupply2 = ghostSupply + newRealSupply2;
  const newBasePrice2 = slope * newTotalSupply2;
  const newLiquidityRatio2 = newRealSupply2 / newTotalSupply2;
  const newLiquidityFactor2 = 0.3 + 0.7 * Math.sqrt(newLiquidityRatio2);
  const newProbability2 = newBasePrice2 / 100;
  const newProbabilityFactor2 = newProbability2 > 0.5 ? Math.max(0.1, 1 - (newProbability2 - 0.5) * 0.8) : 1.0;
  const newEffectiveSlope2 = slope * newLiquidityFactor2 * newProbabilityFactor2;
  const newRealPrice2 = newEffectiveSlope2 * newTotalSupply2;
  
  const avgEffectiveSlope2 = (effectiveSlope2 + newEffectiveSlope2) / 2;
  const cost2 = (avgEffectiveSlope2 / 2) * (newTotalSupply2 * newTotalSupply2 - totalSupply2 * totalSupply2);
  
  reserve2 += cost2;
  realSupply2 = newRealSupply2;
  
  console.log(`Achat ${i+1}:`);
  console.log(`  ${shares} actions`);
  console.log(`  Prix avant: ${realPrice2.toFixed(2)}`);
  console.log(`  Prix après: ${newRealPrice2.toFixed(2)}`);
  console.log(`  Coût: ${cost2.toFixed(2)} Seeds`);
  console.log(`  Réserve totale: ${reserve2.toFixed(2)} Seeds`);
  console.log('');
}

// ============================================

console.log('=== SIMULATION 3 : Version Simplifiée (sans getEffectiveSlope) ===\n');

let realSupply3 = 0;
let reserve3 = 0;

for (let i = 0; i < 3; i++) {
  const totalSupply3 = ghostSupply + realSupply3;
  const realPrice3 = slope * totalSupply3;
  
  const shares = 1000;
  const newRealSupply3 = realSupply3 + shares;
  const newTotalSupply3 = ghostSupply + newRealSupply3;
  const newRealPrice3 = slope * newTotalSupply3;
  
  const cost3 = (slope / 2) * (newTotalSupply3 * newTotalSupply3 - totalSupply3 * totalSupply3);
  
  reserve3 += cost3;
  realSupply3 = newRealSupply3;
  
  console.log(`Achat ${i+1}:`);
  console.log(`  ${shares} actions`);
  console.log(`  Prix avant: ${realPrice3.toFixed(2)}`);
  console.log(`  Prix après: ${newRealPrice3.toFixed(2)}`);
  console.log(`  Coût: ${cost3.toFixed(2)} Seeds`);
  console.log(`  Réserve totale: ${reserve3.toFixed(2)} Seeds`);
  console.log('');
}

// ============================================

console.log('=== COMPARAISON ===\n');
console.log('Version avec getEffectiveSlope:');
console.log(`  Réserve après 3 achats: ${reserve2.toFixed(2)} Seeds`);
console.log(`  Prix final: ${(slope * (ghostSupply + realSupply2)).toFixed(2)} Seeds`);
console.log('');
console.log('Version simplifiée:');
console.log(`  Réserve après 3 achats: ${reserve3.toFixed(2)} Seeds`);
console.log(`  Prix final: ${(slope * (ghostSupply + realSupply3)).toFixed(2)} Seeds`);
console.log('');
console.log('Différence:');
console.log(`  Réserve: ${(reserve2 - reserve3).toFixed(2)} Seeds (${((reserve2 / reserve3 - 1) * 100).toFixed(1)}% plus élevé)`);

