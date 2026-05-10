import { BriefingData } from "../types";

const BRIEFINGS: Record<number, BriefingData> = {
  1: {
    title: "OPERATION NEON DAWN",
    content: "Commander, this is your first drop. Hostile activity is light. Familiarize yourself with your tank's controls and eliminate all targets.",
  },
  2: {
    title: "OPERATION STEEL VEIL",
    content: "Enemy forces are regrouping in this sector. We expect increased resistance. Watch your six and keep moving.",
  },
  3: {
    title: "OPERATION SHADOW STRIKE",
    content: "Intel indicates swift enemy units ahead. Use cover effectively and don't let them outflank you. Destroy them all.",
  },
  4: {
    title: "OPERATION CRIMSON TIDE",
    content: "Heavy armor detected. Your standard tactics might not be enough. Isolate targets and strike when they are vulnerable.",
  },
  5: {
    title: "OPERATION THUNDER FORGE",
    content: "Midpoint reached. The enemy is deploying advanced tracking systems. Stay out of their direct line of sight until you're ready to fire.",
  },
  6: {
    title: "OPERATION NIGHTFALL",
    content: "Visibility is theoretically compromised, but our sensors are online. They are sending waves to break our line. Hold your ground.",
  },
  7: {
    title: "OPERATION VIPER FANG",
    content: "Fast-moving interceptors are patrolling this grid. You must be quicker on the trigger. hesitation means destruction.",
  },
  8: {
    title: "OPERATION IRON TEMPEST",
    content: "We're nearing their command sector. They are throwing everything they have at us. Survive and advance by any means necessary.",
  },
  9: {
    title: "OPERATION OMEGA GATE",
    content: "The final defense line. It's heavily fortified. Push through the barricades and decimate the defending forces.",
  },
  10: {
    title: "OPERATION ZERO HOUR",
    content: "This is it, Commander. The core logic center. Elite units stand in your way. Eradicate them and bring this war to an end.",
  }
};

export const generateMissionBriefing = async (level: number, enemyCount: number): Promise<BriefingData> => {
  // Simulate a brief loading/decryption delay for the retro aesthetic
  await new Promise(resolve => setTimeout(resolve, 800));

  const briefing = BRIEFINGS[level];
  
  if (briefing) {
    return {
      title: briefing.title,
      content: `${briefing.content} Hostile count: ${enemyCount}.`,
    };
  }

  return {
    title: `OPERATION: LEVEL ${level}`,
    content: `Intel reports ${enemyCount} hostiles in the sector. Eliminate them all.`,
  };
};
