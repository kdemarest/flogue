const util 		= require('util');
const path 		= require('path');
const fs 		= require('fs');

let fileListRaw = `
portal/portal.png
dc-dngn/dngn_trap_shaft.png = terrain/shaft.png
effect/fire.png
UNUSED/features/dngn_lava.png = terrain/floorLava.png
effect/cloud_grey_smoke.png = effect/smoke.png
dc-dngn/floor/dirt0.png = terrain/floorMud.png
dc-dngn/altars/dngn_altar_vehumet.png = terrain/ghostStone.png
dc-dngn/altars/dngn_altar_sif_muna.png = terrain/obelisk.png
dc-dngn/altars/dngn_altar_beogh.png = terrain/crystal.png
spells/air/static_discharge.png = terrain/forcefield.png
dc-dngn/pit.png = terrain/pit.png
decor/water.png
portal/stairsDown.png
portal/stairsUp.png
portal/arch1.png
effect/pitDrop.png
portal/door1Open.png
portal/door1Shut.png
portal/door1Locked.png
dc-dngn/mana/fontSolar.png = terrain/fontSolar.png
dc-dngn/mana/fontDeep.png = terrain/fontDeep.png
ore/oreLumpBlack.png
ore/oreMetalWhite.png
ore/oreMetalOrange.png
ore/oreMetalBlack.png
ore/oreMetalYellow.png
ore/oreMetalBlue.png
ore/oreGemCyan.png
ore/oreGemYellow.png
ore/oreGemBlack.png
ore/oreGemPurple.png
ore/oreGemWhite.png
ore/oreGemRed.png
ore/oreGemGreen.png
ore/oreGemBlue.png
ore/oreVein.png
UNUSED/other/key.png = item/misc/key.png
/gui/icons/key.png
item/misc/coin01.png
item/misc/coinTen.png
item/misc/coinPile.png
/gui/icons/coin.png
item/potion/roundedClear.png
item/potion/roundedRed.png
item/potion/roundedGray.png
item/potion/roundedGold.png
item/potion/roundedGreen.png
item/potion/roundedBlack.png
item/potion/roundedBlue.png
item/potion/roundedMagenta.png
item/potion/roundedSilver.png
item/potion/squatBlack.png
item/potion/squatRed.png
item/potion/squatCyan.png
item/potion/squatGreenBubble.png
item/potion/squatPurple.png
item/potion/sqMagentaBlack.png
item/potion/sqYellow.png
item/potion/sqBlue.png
item/potion/sqCyan.png
item/potion/sqPurple.png
item/potion/sqPink.png
item/potion/sqBlack.png
item/potion/sqBrown.png
item/potion/tubeBlack.png
item/potion/tubeBlackBlue.png
item/potion/tubeBlackSilver.png
item/potion/tubeGrayStripe.png
item/potion/tubeWhite.png
item/potion/tubeGold.png
item/potion/tubeRed.png
item/potion/tubeYellow.png
item/potion/flaskWhite.png
item/potion/flaskGray.png
item/potion/flaskOrange.png
/gui/icons/potion.png
item/scroll/scroll.png
/gui/icons/spell.png
/gui/icons/ore.png
gems/Gem Type1 Red.png
gems/Gem Type1 Yellow.png
gems/Gem Type1 Green.png
gems/Gem Type2 Red.png
gems/Gem Type2 Green.png
gems/Gem Type2 Blue.png
gems/Gem Type3 Black.png
/gui/icons/gem.png
item/weapon/dagger.png
/gui/icons/weapon.png
/gui/icons/ammo.png
item/armour/shields/shield3_round.png
/gui/icons/shield.png
item/armour/headgear/helmet2_etched.png
/gui/icons/helm.png
item/armor/fur.png
item/armor/hide.png
item/armor/leather.png
item/armor/studded.png
item/armor/scale.png
item/armor/chain.png
item/armor/steelPlate.png
item/armor/trollHide.png
item/armor/elven.png
item/armor/chitin.png
item/armor/dwarven.png
item/armor/ice.png
item/armor/crystal.png
item/armor/demonHide.png
item/armor/lunar.png
item/armor/deepium.png
item/armor/solar.png
/gui/icons/armor.png
item/armour/cloak3.png
UNUSED/armour/gauntlet1.png
/gui/icons/bracers.png
UNUSED/armour/glove4.png
/gui/icons/gloves.png
item/armour/boots2_jackboots.png
/gui/icons/boots.png
item/ring/brass.png
item/ring/bronze.png
item/ring/silver.png
item/ring/gold.png
/gui/icons/ring.png
item/stuff/shovel.png
item/misc/misc_rune.png
item/stuff/candle.png
item/stuff/torch.png
item/stuff/lamp.png
item/stuff/lantern.png
item/stuff/voidCandle.png
item/stuff/darkLamp.png
item/stuff/darkLantern.png
item/food/chunk.png
item/armour/troll_hide.png
item/food/bone.png
item/food/sultana.png
UNUSED/other/acid_venom.png
item/misc/collar.png
item/stuff/skull.png
item/misc/demonEye.png
item/food/chunk_rotten.png
item/weapon/ranged/rock.png
item/stuff/snailSlime.png
item/stuff/redSlime.png
item/stuff/poisonSlime.png
item/stuff/acidSlime.png
/gui/icons/stuff.png
mon/human/solarPriest.png
mon/human/soldier.png
mon/human/ninja.png
mon/human/ninjaSneak.png
UNUSED/spells/components/dog2.png
terrain/floorSlate.png
terrain/floorDirt.png
dc-dngn/floor/rect_gray1.png
terrain/boulder1.png
terrain/boulder2.png
terrain/boulder3.png
terrain/boulder4.png
terrain/jagged1.png
terrain/jagged2.png
terrain/jagged3.png
terrain/jagged4.png
dc-dngn/floor/pedestal_full.png
dc-dngn/bridgeNS.png
dc-dngn/bridgeEW.png
dc-dngn/floor/grass/grass_flowers_blue1.png
dc-dngn/wall/dngn_mirrored_wall.png
dc-mon/statues/silver_statue.png
dc-mon/statues/wucad_mu_statue.png
gui/icons/marker.png
dc-dngn/crumbled_column.png
dc-dngn/granite_stump.png
decor/brazierLit.png
decor/brazierUnlit.png
decor/tableSmall.png
decor/tableW.png
decor/tableEW.png
decor/tableE.png
decor/tableN.png
decor/tableNS.png
decor/tableS.png
decor/sign.png
decor/signFixed.png
decor/signTable.png
decor/bedHead.png
decor/bedFoot.png
decor/barrel.png
decor/chestShut.png
decor/chestOpen.png
decor/chestEmpty.png
decor/coffinShut.png
decor/coffinOpen.png
decor/coffinEmpty.png
dc-dngn/altars/dngn_altar_shining_one.png
dc-dngn/dngn_blue_fountain.png
item/potion/silver.png
/gui/icons/charm.png
gui/icons/skill.png
/gui/icons/skill.png
UNUSED/spells/components/skull.png
/gui/icons/corpse.png
mon/corpse.png
item/stuff/solarCenturionFigurine.png
item/stuff/figurine.png
item/stuff/sunCrystal.png
item/stuff/solarOrb.png
dc-dngn/altars/dngn_altar_jiyva01.png
plant/wilted.png
/gui/icons/plant.png
plant/seed.png
mon/dwarf/dwarfWarrior.png
dc-mon/human.png
dc-mon/philanthropist.png
dc-mon/refugee.png
mon/solarCenturion.png
dc-mon/hell_knight.png
mon/insect/ambligryp.png
mon/robot/tinnamaton.png
mon/robot/brassamaton.png
mon/insect/boneScorpion.png
player/base/draconian_red_f.png
dc-mon/animals/hell_hound.png
mon/demon/daispine.png
mon/demon/daibelade.png
mon/demon/daifahng.png
mon/demon/daicolasp.png
mon/demon/daimaul.png
mon/demon/daiskorsh.png
mon/demon/daileesh.png
mon/demon/dailectra.png
mon/demon/daiacrid.png
mon/demon/daitox.png
mon/demon/daikay.png
mon/demon/daishulk.png
mon/demon/daibozle.png
mon/demon/daisteria.png
mon/demon/daifury.png
mon/demon/daiphant.png
mon/demon/dailess.png
mon/demon/dairain.png
mon/insect/centipede.png
mon/spider.png
mon/planar/ethermite.png
mon/undead/shade.png
dc-mon/undead/ghoul.png
mon/earth/goblin.png
dc-mon/goblin.png
dc-mon/demons/imp.png
dc-mon/kobold.png
dc-mon/ogre.png
dc-mon/jelly.png
mon/insect/redFiddler.png
mon/insect/blueFiddler.png
mon/insect/greenFiddler.png
mon/insect/blueScarab.png
mon/insect/redScarab.png
mon/plant/arborian.png
dc-mon/undead/shadow.png
mon/undead/crawler.png
dc-mon/undead/skeletons/skeleton_humanoid_small.png
dc-mon/undead/skeletonArcher.png
dc-mon/undead/skeletons/skeleton_humanoid_large.png
mon/insect/giantAnt.png
dc-mon/animals/spiny_frog.png
mon/animal/bear.png
mon/troll.png
dc-mon/animals/viper.png
dc-mon/animals/butterfly.png
dc-mon/deep_elf_demonologist.png
dc-mon/deep_elf_high_priest.png
mon/animal/giantBat.png
mon/snail.png
mon/snailInShell.png
dc-mon/animals/sheep.png
mon/earth/goblinPriest.png
dc-dngn/wallProxy.png
gems/Gem Type2 Yellow.png
gems/Gem Type2 Purple.png
gui/mapUnvisited.png
gui/icons/unmarked.png
gui/icons/marked.png
gui/icons/all.png
ore/oreChaff.png
dc-misc/bloodRed.png
dc-misc/bloodGreen.png
dc-misc/bloodBlue.png
dc-misc/bloodYellow.png
dc-misc/bloodBlack.png
effect/glowRed.png
effect/glowGold.png
effect/cloudPoison96.png
gui/icons/eImmune.png
gui/icons/eResist.png
gui/icons/eVuln.png
gui/icons/iDodge.png
gui/icons/activityEat.png
item/misc/coinOne.png
gui/icons/eGeneric.png
gui/icons/ePoof.png
gui/icons/alert.png
gui/icons/locked.png
gui/icons/unlock.png
gui/icons/open.png
gui/icons/perception.png
gui/selectBox.png
effect/bolt04.png
spells/enchantment/invisibility.png
dc-misc/cursor_green.png
dc-misc/travel_exclusion.png
gui/sortAscending.png
gui/sortDescending.png
effect/arrowInFlight.png
effect/dartInFlight.png
gui/sliceEmpty.png
gui/slice10.png
gui/slice20.png
gui/slice30.png
gui/slice40.png
gui/slice50.png
gui/slice60.png
gui/slice70.png
gui/slice80.png
gui/slice90.png
gui/sliceReady.png
gui/icons/damageCut.png
gui/icons/damageStab.png
gui/icons/damageBite.png
gui/icons/damageClaw.png
gui/icons/damageBash.png
gui/icons/eBurn.png
gui/icons/eLight.png
gui/icons/eFreeze.png
gui/icons/eShock.png
gui/icons/eCorrode.png
gui/icons/ePoison.png
gui/icons/eSmite.png
gui/icons/eRot.png
effect/bolt08.png
item/weapon/ranged/bow1.png
item/weapon/ranged/stealthBow48.png
item/weapon/solariumBlade.png
item/weapon/pickaxe.png
item/weapon/club.png
item/weapon/long_sword1.png
item/weapon/long_sword2.png
item/weapon/mace1.png
item/weapon/hammer.png
item/weapon/battle_axe1.png
item/weapon/spear2.png
item/weapon/bardiche1.png
item/weapon/trident1.png
UNUSED/spells/components/bolt.png
item/weapon/ranged/rock2.png
effect/dart2.png
item/shield/shieldBuckler.png
item/shield/shieldTarge.png
item/shield/shieldHeater.png
item/shield/shieldKite.png
item/shield/shieldPavise.png
gui/icons/eSneakAttack.png
effect/lightRayCircle.png
item/food/bread_ration.png
plant/wheat.png
plant/barley.png
plant/carrot.png
plant/potato.png
plant/pea.png
plant/bean.png
plant/cabbage.png
mushroom/amanita.png
mushroom/blurella.png
mushroom/coxillia.png
mushroom/grollotus.png
mushroom/klinulus.png
mushroom/rhodotus.png
part/blood.png
part/brain.png
part/bone.png
part/skull.png
part/tooth.png
part/heart.png
part/eye.png
part/tongue.png
part/skin.png
part/claw.png
part/liver.png
part/gland.png
part/icor.png
part/chitin.png
part/oculus.png
part/gear.png
part/hasp.png
part/oil.png
part/tentacle.png
part/slime.png
part/leaf.png
part/sap.png
part/bark.png
part/flower.png
part/wing.png
plant/wheatPlant.png
plant/barleyPlant.png
plant/carrotPlant.png
plant/potatoPlant.png
plant/peaPlant.png
plant/beanPlant.png
plant/cabbagePlant.png
gui/icons/eVision.png
gui/icons/eFragrance.png
gui/icons/eTeleport.png
gui/icons/eFly.png
gui/icons/eHaste.png
gui/icons/eBlind.png
gui/icons/eInvisible.png
gui/icons/eMagic.png
gui/icons/eShove.png
gui/icons/eAttitude.png
gui/icons/eFear.png
gui/icons/eSlow.png
gui/icons/ePossess.png
gui/icons/eImmobile.png
gui/icons/eDrain.png
gui/icons/eHeal.png
gui/icons/eWater.png
gui/icons/eLeech.png
`.split('\n');


let fileList = [];
fileListRaw.forEach( (text, index) => {
	let parts = text.split('=');
	fileList.push({
		source: parts[0].trim(),
		target: ( parts[1] ? parts[1] : parts[0] ).trim()
	});
});

let pathSource = '../tsrc/';
let pathTarget = '../tiles/';

function getSourcePath(fileName) {
	return pathSource+fileName;
}

function getTargetPath(fileName) {
	return pathTarget+fileName;
}

fileList.forEach( spec => {
	let sourcePath = getSourcePath(spec.source);
	let targetPath = getTargetPath(spec.target);
	if( fs.existsSync(targetPath) && !fs.existsSync(sourcePath) ) {
		console.log('Missing:',sourcePath);
	}
});






