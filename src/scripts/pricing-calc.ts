// #!/usr/bin/env tsx

// import {
//   calculateTextModelCreditCost,
//   calculateConversationCreditCost,
//   calculateReplicateImageCreditCost,
// } from "../lib/usage/credit-calculator";
// import { CREDIT_CONFIG } from "../lib/usage/types";
// import type {
//   ImageUpdate,
//   AssessmentUpdate,
//   ConversationUpdate,
//   TranscriptionUpdate,
//   PromptHelperUpdate,
// } from "../data/usage";
// import pricingData from "../data/pricing.json";
// import { MODEL_NAMES } from "@/types/models";

// // Get pricing for text models (per 1M tokens)
// function getTextModelPricing(
//   modelName: string
// ): { input: number; cachedInput: number; output: number } | null {
//   const model = pricingData.latest_models_text_tokens.find(
//     (m) => m.model === modelName
//   );
//   if (!model) return null;

//   return {
//     input: model.input / 1_000_000, // Convert from per 1M to per token
//     cachedInput: (model.cached_input || model.input) / 1_000_000,
//     output: model.output / 1_000_000,
//   };
// }

// // Get pricing for image generation
// function getImagePricing(
//   modelName: string,
//   quality: "low" | "medium" | "high",
//   size: "square" | "portrait" | "landscape"
// ): number {
//   const sizeMap = {
//     square: "1024x1024",
//     portrait: "1024x1536",
//     landscape: "1536x1024",
//   };

//   const dimensions = sizeMap[size];
//   const imageModel =
//     pricingData.image_generation[
//       modelName as keyof typeof pricingData.image_generation
//     ];

//   if (!imageModel) return 0;

//   const qualityPricing = imageModel[quality as keyof typeof imageModel];
//   if (!qualityPricing) return 0;

//   return qualityPricing[dimensions as keyof typeof qualityPricing] || 0;
// }

// // Get realtime audio pricing
// function getRealtimePricing(modelName: string): {
//   inputText: number;
//   inputAudio: number;
//   outputText: number;
//   outputAudio: number;
// } | null {
//   // Find in text models for text pricing
//   const textModel = pricingData.latest_models_text_tokens.find(
//     (m) => m.model === modelName
//   );
//   if (!textModel) return null;

//   // Find in audio models for audio pricing
//   const audioModel = pricingData.image_tokens.find(
//     (m) => m.model === modelName
//   );
//   if (!audioModel) return null;

//   return {
//     inputText: textModel.input / 1_000_000,
//     inputAudio: audioModel.input / 1_000_000,
//     outputText: textModel.output / 1_000_000,
//     outputAudio: audioModel.output / 1_000_000,
//   };
// }

// // Get transcription pricing (per minute)
// function getTranscriptionPricing(): number {
//   return pricingData.whisper.transcription_per_minute;
// }

// // Helper to calculate actual cost without margin
// function calculateActualCost(
//   usageType:
//     | "assessment"
//     | "promptHelper"
//     | "images"
//     | "conversation"
//     | "transcription",
//   update:
//     | AssessmentUpdate
//     | PromptHelperUpdate
//     | ImageUpdate
//     | ConversationUpdate
//     | TranscriptionUpdate
// ): number {
//   // This uses the same logic as the credit cost functions but without the margin multiplier
//   const costUSD = calculateCreditCostInUSD(usageType, update);
//   return costUSD;
// }

// // Helper to get USD cost directly (without margin)
// function calculateCreditCostInUSD(
//   usageType:
//     | "assessment"
//     | "promptHelper"
//     | "images"
//     | "conversation"
//     | "transcription",
//   update:
//     | AssessmentUpdate
//     | PromptHelperUpdate
//     | ImageUpdate
//     | ConversationUpdate
//     | TranscriptionUpdate
// ): number {
//   // Same logic as the credit cost functions but return USD directly without margin
//   switch (usageType) {
//     case "assessment": {
//       const textUpdate = update as AssessmentUpdate;
//       const pricing = getTextModelPricing(textUpdate.modelName);
//       if (!pricing) return 0;

//       const cachedTokens = textUpdate.promptTokens.text.cached || 0;
//       const notCachedTokens = textUpdate.promptTokens.text.notCached || 0;
//       const outputTokens = textUpdate.outputTokens || 0;

//       return (
//         cachedTokens * pricing.cachedInput +
//         notCachedTokens * pricing.input +
//         outputTokens * pricing.output
//       );
//     }

//     case "promptHelper": {
//       const textUpdate = update as PromptHelperUpdate;
//       const pricing = getTextModelPricing(textUpdate.modelName);
//       if (!pricing) return 0;

//       const cachedTokens = textUpdate.promptTokens.text.cached || 0;
//       const notCachedTokens = textUpdate.promptTokens.text.notCached || 0;
//       const outputTokens = textUpdate.outputTokens || 0;

//       return (
//         cachedTokens * pricing.cachedInput +
//         notCachedTokens * pricing.input +
//         outputTokens * pricing.output
//       );
//     }

//     case "images": {
//       const imageUpdate = update as ImageUpdate;
//       return getImagePricing(
//         imageUpdate.modelName,
//         imageUpdate.quality,
//         imageUpdate.size
//       );
//     }

//     case "conversation": {
//       const convUpdate = update as ConversationUpdate;
//       const pricing = getRealtimePricing(convUpdate.modelName);
//       if (!pricing) return 0;

//       const textCachedTokens = convUpdate.promptTokens.text?.cached || 0;
//       const textNotCachedTokens = convUpdate.promptTokens.text?.notCached || 0;
//       const audioCachedTokens = convUpdate.promptTokens.audio?.cached || 0;
//       const audioNotCachedTokens =
//         convUpdate.promptTokens.audio?.notCached || 0;
//       const outputTextTokens = convUpdate.outputTokens?.text || 0;
//       const outputAudioTokens = convUpdate.outputTokens?.audio || 0;

//       return (
//         textCachedTokens * pricing.inputText * 0.5 + // 50% discount for cached
//         textNotCachedTokens * pricing.inputText +
//         audioCachedTokens * pricing.inputAudio * 0.5 + // 50% discount for cached
//         audioNotCachedTokens * pricing.inputAudio +
//         outputTextTokens * pricing.outputText +
//         outputAudioTokens * pricing.outputAudio
//       );
//     }

//     case "transcription": {
//       const transUpdate = update as TranscriptionUpdate;
//       const sessionLengthMinutes = (transUpdate.totalSessionLength || 0) / 60;
//       const costPerMinute = getTranscriptionPricing();
//       return sessionLengthMinutes * costPerMinute;
//     }

//     default:
//       return 0;
//   }
// }

// // Calculate conversation + assessment scenario costs
// function calculateConversationScenario() {
//   // Based on real data: 87.95 seconds (1.466 minutes) of conversation
//   // Normalized to per-minute costs

//   const oneMinuteConversation: ConversationUpdate = {
//     modelName: MODEL_NAMES.OPENAI_REALTIME,
//     promptTokens: {
//       text: { cached: 0, notCached: 768 }, // Real data: 1126/1.466 = 768/min
//       audio: { cached: 0, notCached: 700 }, // Real data: 1026/1.466 = 700/min
//     },
//     outputTokens: {
//       text: 108, // Real data: 158/1.466 = 108/min
//       audio: 505, // Real data: 741/1.466 = 505/min
//     },
//     totalTokens: 2081, // Total per minute
//     totalSessionLength: 60, // 1 minute
//   };

//   // const oneMinuteTranscription: TranscriptionUpdate = {
//   //   modelName: "gpt-4o-transcribe",
//   //   totalSessionLength: 60, // 1 minute
//   //   inputTokens: 38, // Sample token counts based on example from user
//   //   outputTokens: 10,
//   //   totalTokens: 48,
//   //   inputTextTokens: 10,
//   //   inputAudioTokens: 28,
//   // };

//   // Assessment based on real usage: 2 assessments per 1.47 minutes = 1.36 assessments/minute
//   // But for simplicity, let's calculate cost of 1 assessment and note frequency
//   const conversationAssessment: AssessmentUpdate = {
//     modelName: "gpt-4o",
//     promptTokens: {
//       text: {
//         cached: 512, // Real data: 1024/2 = 512 per assessment
//         notCached: 520, // Real data: 1040/2 = 520 per assessment
//       },
//     },
//     outputTokens: 735, // Real data: 1470/2 = 735 per assessment
//     totalTokens: 1767, // Real data: 3534/2 = 1767 per assessment
//   };

//   const conversationCost = calculateConversationCreditCost(
//     oneMinuteConversation.modelName,
//     {
//       textTokens: {
//         cachedTokens: oneMinuteConversation.promptTokens.text?.cached || 0,
//         notCachedTokens:
//           oneMinuteConversation.promptTokens.text?.notCached || 0,
//       },
//       audioTokens: {
//         cachedTokens: oneMinuteConversation.promptTokens.audio?.cached || 0,
//         notCachedTokens:
//           oneMinuteConversation.promptTokens.audio?.notCached || 0,
//       },
//       outputTextTokens: oneMinuteConversation.outputTokens?.text || 0,
//       outputAudioTokens: oneMinuteConversation.outputTokens?.audio || 0,
//     }
//   );
//   // const transcriptionCost = calculateTranscriptionCreditCost({
//   //   sessionLengthMinutes: (oneMinuteTranscription.totalSessionLength || 0) / 60,
//   // });
//   const transcriptionCost = 0; // TODO: FIX THIS
//   const assessmentCost = calculateTextModelCreditCost(
//     conversationAssessment.modelName,
//     {
//       cachedTokens: conversationAssessment.promptTokens.text.cached || 0,
//       notCachedTokens: conversationAssessment.promptTokens.text.notCached || 0,
//       outputTokens: conversationAssessment.outputTokens || 0,
//     }
//   );

//   // Based on real data: 2 assessments per 1.47 minutes = 1.36 assessments per minute
//   const assessmentsPerMinute = 1.36;
//   const totalAssessmentCostPerMinute = assessmentCost * assessmentsPerMinute;

//   const totalCostPerMinute =
//     conversationCost + transcriptionCost + totalAssessmentCostPerMinute;

//   return {
//     conversationCost,
//     transcriptionCost,
//     assessmentCost,
//     assessmentsPerMinute,
//     totalAssessmentCostPerMinute,
//     totalCostPerMinute,
//     breakdown: {
//       conversation: conversationCost,
//       transcription: transcriptionCost,
//       assessment: totalAssessmentCostPerMinute,
//     },
//   };
// }

// // Calculate training creation scenario costs
// function calculateTrainingCreationScenario() {
//   // One complete training creation includes:
//   // - 1 training cover image (medium quality, square)
//   // - 4 character images (medium quality, square)
//   // - 2.5x iterations (users iterate 2-3 times per image)
//   // - Prompt helper usage for generating training content

//   const imageCostPerImage = calculateReplicateImageCreditCost(
//     "google/imagen-4-fast",
//     1
//   );
//   const totalImagesPerTraining = 5; // 1 cover + 4 characters
//   const iterationMultiplier = 2.5; // Average 2-3 iterations
//   const totalImageCost =
//     imageCostPerImage * totalImagesPerTraining * iterationMultiplier;

//   // Prompt helper for training content generation
//   const trainingContentGeneration: PromptHelperUpdate = {
//     modelName: "gpt-4o",
//     promptTokens: { text: { cached: 0, notCached: 1500 } }, // Instructions + context
//     outputTokens: 800, // Generated content
//     totalTokens: 2300,
//   };

//   const promptHelperCost = calculateTextModelCreditCost(
//     trainingContentGeneration.modelName,
//     {
//       cachedTokens: trainingContentGeneration.promptTokens.text.cached || 0,
//       notCachedTokens:
//         trainingContentGeneration.promptTokens.text.notCached || 0,
//       outputTokens: trainingContentGeneration.outputTokens || 0,
//     }
//   );

//   // Assume 3-4 prompt helper calls per training (different modules/content)
//   const totalPromptHelperCost = promptHelperCost * 3.5;

//   const totalTrainingCost = totalImageCost + totalPromptHelperCost;

//   return {
//     imageCostPerImage,
//     totalImagesPerTraining,
//     iterationMultiplier,
//     totalImageCost,
//     promptHelperCostPerCall: promptHelperCost,
//     totalPromptHelperCost,
//     totalTrainingCost,
//     breakdown: {
//       images: totalImageCost,
//       promptHelper: totalPromptHelperCost,
//     },
//   };
// }

// // Main script
// console.log(
//   "🚀 AI Usage Calculator - User Acquisition & Realistic Usage Patterns"
// );
// console.log(`💰 Credit Value: $${CREDIT_CONFIG.CREDIT_VALUE_USD} per credit`);
// console.log(
//   `📈 Business Margin: ${((CREDIT_CONFIG.MARGIN_MULTIPLIER - 1) * 100).toFixed(0)}% (applied to paid tiers only)`
// );

// // Show cost breakdowns first
// console.log("\n" + "=".repeat(80));
// console.log("📊 ACTUAL COST BREAKDOWN (what you pay OpenAI)");
// console.log("=".repeat(80));

// const conversationDetails = calculateConversationScenario();
// const trainingDetails = calculateTrainingCreationScenario();

// // Calculate actual costs without margin
// const actualConversationCost = calculateActualCost("conversation", {
//   modelName: MODEL_NAMES.OPENAI_REALTIME,
//   promptTokens: {
//     text: { cached: 0, notCached: 768 },
//     audio: { cached: 0, notCached: 700 },
//   },
//   outputTokens: { text: 108, audio: 505 },
//   totalTokens: 2081,
//   totalSessionLength: 60,
// });

// const actualTranscriptionCost = calculateActualCost("transcription", {
//   modelName: "gpt-4o-transcribe",
//   totalSessionLength: 60,
//   inputTokens: 38,
//   outputTokens: 10,
//   totalTokens: 48,
//   inputTextTokens: 10,
//   inputAudioTokens: 28,
// });

// const actualAssessmentCost = calculateActualCost("assessment", {
//   modelName: "gpt-4o",
//   promptTokens: { text: { cached: 512, notCached: 520 } },
//   outputTokens: 735,
//   totalTokens: 1767,
// });

// const actualCostPerMinute =
//   actualConversationCost +
//   actualTranscriptionCost +
//   actualAssessmentCost * 1.36;

// // const actualTrainingImageCost = calculateActualCost("images", {
// //   modelName: "gpt_image_1",
// //   quality: "medium",
// //   size: "square",
// //   promptTokens: {
// //     text: { cached: 0, notCached: 0 },
// //     image: { cached: 0, notCached: 0 },
// //   },
// // });
// const actualTrainingImageCost = 0;

// const actualTrainingContentCost = calculateActualCost("promptHelper", {
//   modelName: "gpt-4o",
//   promptTokens: { text: { cached: 0, notCached: 1500 } },
//   outputTokens: 800,
//   totalTokens: 2300,
// });

// const actualTrainingCost =
//   actualTrainingImageCost * 5 * 2.5 + actualTrainingContentCost * 3.5;

// console.log("\n🎙️ Conversation + Assessment (per minute):");
// console.log(`  Real-time conversation: $${actualConversationCost.toFixed(4)}`);
// console.log(`  Transcription: $${actualTranscriptionCost.toFixed(4)}`);
// console.log(
//   `  Assessment: $${(actualAssessmentCost * 1.36).toFixed(4)} (1.36 assessments @ $${actualAssessmentCost.toFixed(4)} each)`
// );
// console.log(`  TOTAL: $${actualCostPerMinute.toFixed(4)}/minute`);

// console.log("\n🎨 Training Creation (per complete training):");
// console.log(
//   `  Medium images (5 × 2.5 iterations): $${(actualTrainingImageCost * 5 * 2.5).toFixed(4)}`
// );
// console.log(
//   `  Content generation (3.5 calls): $${(actualTrainingContentCost * 3.5).toFixed(4)}`
// );
// console.log(`  TOTAL: $${actualTrainingCost.toFixed(4)}/training`);

// // FREE TIER - User Acquisition Cost Analysis
// console.log("\n" + "=".repeat(80));
// console.log("🆓 FREE TIER - USER ACQUISITION COST ANALYSIS");
// console.log("=".repeat(80));

// const freeCredits = 100;
// const maxFreeConversationMinutes = Math.floor(
//   freeCredits / conversationDetails.totalCostPerMinute
// );
// const maxFreeTrainings = Math.floor(
//   freeCredits / trainingDetails.totalTrainingCost
// );

// console.log(`📊 What 100 credits provides (monthly):`);
// console.log(
//   `  Pure conversation: ${maxFreeConversationMinutes} minutes → costs you $${(actualCostPerMinute * maxFreeConversationMinutes).toFixed(2)}/month per user`
// );
// console.log(
//   `  Pure training creation: ${maxFreeTrainings} trainings → costs you $${(actualTrainingCost * maxFreeTrainings).toFixed(2)}/month per user`
// );

// // Realistic free tier usage scenarios
// const freeScenarios = [
//   { trainings: 1, description: "Light trial" },
//   { trainings: 2, description: "Moderate evaluation" },
//   { trainings: 3, description: "Heavy evaluation" },
// ];

// console.log(`\n💡 Realistic Free Tier Usage & Your Costs:`);
// freeScenarios.forEach((scenario) => {
//   const trainingCredits =
//     scenario.trainings * trainingDetails.totalTrainingCost;
//   const remainingCredits = freeCredits - trainingCredits;
//   const conversationMinutes = Math.floor(
//     remainingCredits / conversationDetails.totalCostPerMinute
//   );
//   const totalCost =
//     scenario.trainings * actualTrainingCost +
//     conversationMinutes * actualCostPerMinute;

//   console.log(
//     `  ${scenario.description}: ${scenario.trainings} trainings + ${conversationMinutes} conversation minutes → costs you $${totalCost.toFixed(2)}/month`
//   );
// });

// // PAID TIERS - With Markup and Realistic Usage
// console.log("\n" + "=".repeat(80));
// console.log("💰 PAID TIERS - WITH MARKUP & REALISTIC USAGE");
// console.log("=".repeat(80));

// const paidTiers = [
//   {
//     name: "PLUS",
//     credits: 400, // $20 / $0.05 = 400 credits
//     price: 20,
//     description: "Individual creators",
//     targetTrainings: 8, // Reasonable for $20 tier
//     teamSize: 1,
//   },
//   {
//     name: "PRO",
//     credits: 1000, // $50 / $0.05 = 1000 credits
//     price: 50,
//     description: "Power users & heavy creators",
//     targetTrainings: 15, // More training creation
//     teamSize: 1,
//   },
//   {
//     name: "TEAM",
//     credits: 600, // $30 / $0.05 = 600 credits per member
//     price: 30,
//     description: "Per team member (admin pays for all)",
//     targetTrainings: 12, // Shared creation across team
//     teamSize: 5, // Example team size for calculation
//   },
// ];

// paidTiers.forEach((tier) => {
//   console.log(
//     `\n🎯 ${tier.name} TIER ($${tier.price}${tier.name === "TEAM" ? "/member" : ""}/month) - ${tier.description}:`
//   );

//   if (tier.name === "TEAM") {
//     // For team tier, show per-member allocation
//     console.log(`  Credits per member: ${tier.credits} credits`);
//     console.log(
//       `  Example team cost: ${tier.teamSize} members × $${tier.price} = $${tier.teamSize * tier.price}/month`
//     );
//   }

//   // Show what the tier provides with markup
//   const maxConversationMinutes = Math.floor(
//     tier.credits / conversationDetails.totalCostPerMinute
//   );
//   const maxTrainings = Math.floor(
//     tier.credits / trainingDetails.totalTrainingCost
//   );

//   console.log(
//     `  Maximum capacity per ${tier.name === "TEAM" ? "member" : "user"}: ${maxConversationMinutes} conversation minutes OR ${maxTrainings} trainings`
//   );

//   if (tier.name === "TEAM") {
//     // For team tier, show different usage pattern
//     // Admin creates trainings, members mainly use conversation
//     const adminTrainingCredits =
//       tier.targetTrainings * trainingDetails.totalTrainingCost;
//     const remainingCreditsPerMember =
//       tier.credits - adminTrainingCredits / tier.teamSize; // Distribute training cost across team
//     const memberConversationMinutes = Math.floor(
//       remainingCreditsPerMember / conversationDetails.totalCostPerMinute
//     );

//     console.log(`  Team usage model:`);
//     console.log(
//       `    - Admin creates: ${tier.targetTrainings} trainings (cost distributed across team)`
//     );
//     console.log(
//       `    - Each member gets: ${Math.floor(memberConversationMinutes)} conversation minutes (${(memberConversationMinutes / 60).toFixed(1)} hours)`
//     );

//     // Calculate actual costs for team
//     const actualTrainingCostTotal = tier.targetTrainings * actualTrainingCost;
//     const actualConversationCostPerMember =
//       memberConversationMinutes * actualCostPerMinute;
//     const totalActualCostPerMember =
//       actualTrainingCostTotal / tier.teamSize + actualConversationCostPerMember;
//     const profitPerMember = tier.price - totalActualCostPerMember;
//     const profitMarginPerMember = (profitPerMember / tier.price) * 100;

//     console.log(
//       `  Economics per member: $${totalActualCostPerMember.toFixed(2)} cost | $${profitPerMember.toFixed(2)} profit | ${profitMarginPerMember.toFixed(1)}% margin`
//     );
//     console.log(
//       `  Total team revenue: $${tier.teamSize * tier.price}/month (${tier.teamSize} × $${tier.price})`
//     );
//   } else {
//     // Individual tier usage
//     const trainingCreditsUsed =
//       tier.targetTrainings * trainingDetails.totalTrainingCost;
//     const remainingCreditsForConversation = tier.credits - trainingCreditsUsed;
//     const availableConversationMinutes = Math.floor(
//       remainingCreditsForConversation / conversationDetails.totalCostPerMinute
//     );

//     console.log(
//       `  Realistic usage: ${tier.targetTrainings} trainings + ${availableConversationMinutes} conversation minutes`
//     );
//     console.log(
//       `    - Conversation time: ${availableConversationMinutes} minutes (${(availableConversationMinutes / 60).toFixed(1)} hours)`
//     );

//     // Your actual costs and profit
//     const actualCostForUsage =
//       tier.targetTrainings * actualTrainingCost +
//       availableConversationMinutes * actualCostPerMinute;
//     const profit = tier.price - actualCostForUsage;
//     const profitMargin = (profit / tier.price) * 100;

//     console.log(
//       `  Your costs: $${actualCostForUsage.toFixed(2)} | Profit: $${profit.toFixed(2)} | Margin: ${profitMargin.toFixed(1)}%`
//     );
//   }
// });

// console.log(`\n🏢 ENTERPRISE TIER - Custom pricing & volume discounts`);
// console.log(`  Contact sales for pricing based on usage requirements`);
// console.log(`  Typically: Custom credit allocations + dedicated support + SLA`);

// console.log("\n" + "=".repeat(80));
// console.log("💡 BUSINESS INSIGHTS:");
// console.log(
//   "🆓 Basic (Free): $3-4/month acquisition cost - sustainable for user growth"
// );
// console.log(
//   "💰 Plus ($20): Competitive individual pricing with healthy margins"
// );
// console.log("🚀 Pro ($50): Power users with extensive usage get premium value");
// console.log(
//   "👥 Team ($30/seat): Shared creation model scales well - admin pays for team access"
// );
// console.log(
//   "📈 Focus: Conversation time drives upgrades, training creation enables team collaboration"
// );
// console.log(
//   "🎯 Sweet spot: Plus for individuals, Team for organizations, Pro for power users"
// );

// // CONVERSION FUNNEL ANALYSIS
// console.log("\n" + "=".repeat(80));
// console.log("📊 CONVERSION FUNNEL ANALYSIS - Free User Acquisition Economics");
// console.log("=".repeat(80));

// // Conversion rates
// const conversionRates = {
//   basicToPlus: 0.01, // 1%
//   basicToPro: 0.001, // 0.1%
//   basicToTeam: 0.0025, // 0.25%
// };

// const avgTeamSize = 5;

// // Monthly costs and profits
// const basicCostPerUser = 3.27; // Average from scenarios above
// const plusProfitPerUser = 6.73;
// const proProfitPerUser = 16.67;
// const teamProfitPerTeam = 10.03 * avgTeamSize; // $50.15 per team

// console.log("📈 Conversion Assumptions:");
// console.log(
//   `  Basic → Plus: ${(conversionRates.basicToPlus * 100).toFixed(1)}%`
// );
// console.log(`  Basic → Pro: ${(conversionRates.basicToPro * 100).toFixed(1)}%`);
// console.log(
//   `  Basic → Team: ${(conversionRates.basicToTeam * 100).toFixed(2)}% (${avgTeamSize} members each)`
// );
// console.log(`  Basic user cost: $${basicCostPerUser}/month`);

// // Calculate scenarios at different scales
// const userScales = [1000, 5000, 10000, 25000, 50000, 100000];

// console.log("\n💰 Revenue vs Free User Costs at Scale:");
// console.log(
//   "Users".padEnd(8) +
//     "Plus".padEnd(8) +
//     "Pro".padEnd(8) +
//     "Teams".padEnd(8) +
//     "Revenue".padEnd(12) +
//     "Free Cost".padEnd(12) +
//     "Net Profit".padEnd(12) +
//     "Break-even"
// );

// userScales.forEach((totalUsers) => {
//   // Calculate conversions
//   const plusUsers = Math.floor(totalUsers * conversionRates.basicToPlus);
//   const proUsers = Math.floor(totalUsers * conversionRates.basicToPro);
//   const teams = Math.floor(totalUsers * conversionRates.basicToTeam);

//   // Calculate monthly revenue and costs
//   const plusRevenue = plusUsers * plusProfitPerUser;
//   const proRevenue = proUsers * proProfitPerUser;
//   const teamRevenue = teams * teamProfitPerTeam;
//   const totalRevenue = plusRevenue + proRevenue + teamRevenue;

//   const freeCost = totalUsers * basicCostPerUser;
//   const netProfit = totalRevenue - freeCost;
//   const isBreakEven = netProfit >= 0;

//   console.log(
//     `${totalUsers.toLocaleString()}`.padEnd(8) +
//       `${plusUsers}`.padEnd(8) +
//       `${proUsers}`.padEnd(8) +
//       `${teams}`.padEnd(8) +
//       `$${totalRevenue.toLocaleString()}`.padEnd(12) +
//       `$${freeCost.toLocaleString()}`.padEnd(12) +
//       `$${netProfit.toLocaleString()}`.padEnd(12) +
//       `${isBreakEven ? "✅" : "❌"}`
//   );
// });

// // Find break-even point
// let breakEvenUsers = 0;
// for (let users = 100; users <= 100000; users += 100) {
//   const plusUsers = Math.floor(users * conversionRates.basicToPlus);
//   const proUsers = Math.floor(users * conversionRates.basicToPro);
//   const teams = Math.floor(users * conversionRates.basicToTeam);

//   const totalRevenue =
//     plusUsers * plusProfitPerUser +
//     proUsers * proProfitPerUser +
//     teams * teamProfitPerTeam;
//   const freeCost = users * basicCostPerUser;

//   if (totalRevenue >= freeCost) {
//     breakEvenUsers = users;
//     break;
//   }
// }

// console.log(`\n🎯 KEY METRICS:`);
// console.log(
//   `  Break-even point: ~${breakEvenUsers.toLocaleString()} total users`
// );
// console.log(`  At break-even:`);
// console.log(
//   `    - Plus subscribers: ${Math.floor(breakEvenUsers * conversionRates.basicToPlus)}`
// );
// console.log(
//   `    - Pro subscribers: ${Math.floor(breakEvenUsers * conversionRates.basicToPro)}`
// );
// console.log(
//   `    - Teams: ${Math.floor(breakEvenUsers * conversionRates.basicToTeam)} (${Math.floor(breakEvenUsers * conversionRates.basicToTeam) * avgTeamSize} total members)`
// );

// // Revenue composition analysis
// const analysisScale = 10000; // 10K users for detailed analysis
// const analysisPlus = Math.floor(analysisScale * conversionRates.basicToPlus);
// const analysisPro = Math.floor(analysisScale * conversionRates.basicToPro);
// const analysisTeams = Math.floor(analysisScale * conversionRates.basicToTeam);

// const analysisPlusRevenue = analysisPlus * plusProfitPerUser;
// const analysisProRevenue = analysisPro * proProfitPerUser;
// const analysisTeamRevenue = analysisTeams * teamProfitPerTeam;
// const analysisTotalRevenue =
//   analysisPlusRevenue + analysisProRevenue + analysisTeamRevenue;

// console.log(
//   `\n📊 Revenue Composition (at ${analysisScale.toLocaleString()} users):`
// );
// console.log(
//   `  Plus tier: $${analysisPlusRevenue.toLocaleString()} (${((analysisPlusRevenue / analysisTotalRevenue) * 100).toFixed(1)}%)`
// );
// console.log(
//   `  Pro tier: $${analysisProRevenue.toLocaleString()} (${((analysisProRevenue / analysisTotalRevenue) * 100).toFixed(1)}%)`
// );
// console.log(
//   `  Team tier: $${analysisTeamRevenue.toLocaleString()} (${((analysisTeamRevenue / analysisTotalRevenue) * 100).toFixed(1)}%)`
// );

// console.log(`\n💡 STRATEGIC INSIGHTS:`);
// console.log(`  🎯 Teams drive highest revenue despite lower conversion rate`);
// console.log(
//   `  📈 Break-even at ${breakEvenUsers.toLocaleString()} users enables profitable growth`
// );
// console.log(
//   `  💰 At 50K users: $${(50000 * conversionRates.basicToPlus * plusProfitPerUser + 50000 * conversionRates.basicToPro * proProfitPerUser + 50000 * conversionRates.basicToTeam * teamProfitPerTeam - 50000 * basicCostPerUser).toLocaleString()}/month profit`
// );
// console.log(
//   `  🚀 Free tier ROI improves with scale - early investment pays off`
// );
// console.log(
//   `  🔑 Focus on team acquisition: 1 team = ${avgTeamSize}x revenue of Plus user`
// );

// // REQUIRED CONVERSION RATE ANALYSIS
// console.log("\n" + "=".repeat(80));
// console.log("⚠️  CONVERSION RATE REALITY CHECK");
// console.log("=".repeat(80));

// console.log(
//   "❌ Current conversion rates are TOO LOW to cover free user costs!"
// );
// console.log("📊 Analysis: Revenue per 1000 users vs Costs:");

// const testUsers = 1000;
// const currentRevenue =
//   testUsers * conversionRates.basicToPlus * plusProfitPerUser +
//   testUsers * conversionRates.basicToPro * proProfitPerUser +
//   testUsers * conversionRates.basicToTeam * teamProfitPerTeam;
// const currentCost = testUsers * basicCostPerUser;

// console.log(
//   `  Current: $${currentRevenue.toFixed(2)} revenue vs $${currentCost.toFixed(2)} cost = $${(currentRevenue - currentCost).toFixed(2)} loss`
// );

// // Calculate required conversion rates for break-even
// console.log("\n🎯 REQUIRED CONVERSION RATES FOR BREAK-EVEN:");

// // Scenario 1: Focus on Plus tier only
// const requiredPlusOnly = basicCostPerUser / plusProfitPerUser;
// console.log(
//   `  Plus-only model: ${(requiredPlusOnly * 100).toFixed(2)}% conversion needed`
// );

// // Scenario 2: Focus on Team tier only
// const requiredTeamOnly = basicCostPerUser / teamProfitPerTeam;
// console.log(
//   `  Team-only model: ${(requiredTeamOnly * 100).toFixed(3)}% conversion needed`
// );

// // Scenario 3: Realistic mixed approach
// console.log("\n💰 REALISTIC CONVERSION TARGETS:");
// const targetScenarios = [
//   { plus: 0.02, pro: 0.002, team: 0.005, name: "Conservative" },
//   { plus: 0.03, pro: 0.003, team: 0.007, name: "Moderate" },
//   { plus: 0.05, pro: 0.005, team: 0.01, name: "Aggressive" },
// ];

// targetScenarios.forEach((scenario) => {
//   const revenue =
//     testUsers * scenario.plus * plusProfitPerUser +
//     testUsers * scenario.pro * proProfitPerUser +
//     testUsers * scenario.team * teamProfitPerTeam;
//   const netResult = revenue - currentCost;
//   const isProfit = netResult > 0;

//   console.log(
//     `  ${scenario.name}: Plus ${(scenario.plus * 100).toFixed(1)}%, Pro ${(scenario.pro * 100).toFixed(1)}%, Team ${(scenario.team * 100).toFixed(1)}% = $${netResult.toFixed(2)} ${isProfit ? "profit" : "loss"}`
//   );
// });

// console.log("\n🚨 CRITICAL BUSINESS IMPLICATIONS:");
// console.log(
//   "1. FREE TIER IS EXPENSIVE - Need ~2-5% overall conversion to break even"
// );
// console.log(
//   "2. TEAM TIER IS KEY - 1% team conversion = 15% Plus conversion in revenue"
// );
// console.log("3. ALTERNATIVE STRATEGIES:");
// console.log("   • Reduce free tier credits (e.g., 50 credits = $1.64 cost)");
// console.log("   • Add usage limits instead of credit limits");
// console.log("   • Focus heavily on team acquisition & enterprise sales");
// console.log(
//   "   • Implement time-limited free trials instead of perpetual free tier"
// );

// // Alternative free tier analysis
// console.log("\n💡 ALTERNATIVE FREE TIER SCENARIOS:");
// const altFreeCredits = [50, 75, 100];
// altFreeCredits.forEach((credits) => {
//   const altConversationMinutes = Math.floor(
//     credits / conversationDetails.totalCostPerMinute
//   );
//   const altTrainings = Math.floor(credits / trainingDetails.totalTrainingCost);
//   const altCost = altConversationMinutes * actualCostPerMinute;
//   const requiredConversion = altCost / plusProfitPerUser;

//   console.log(
//     `  ${credits} credits: ${altConversationMinutes} min conversation OR ${altTrainings} trainings = $${altCost.toFixed(2)} cost = ${(requiredConversion * 100).toFixed(2)}% Plus conversion needed`
//   );
// });

// // ONE-TIME FREE CREDIT MODEL ANALYSIS
// console.log("\n" + "=".repeat(80));
// console.log("🎯 ONE-TIME FREE CREDIT MODEL - GAME CHANGER!");
// console.log("=".repeat(80));

// console.log(
//   "💡 Instead of monthly recurring costs, give new users ONE-TIME credits:"
// );

// const oneTimeFreeCredits = [50, 75, 100, 150];
// console.log("\n📊 ONE-TIME ACQUISITION COST vs LIFETIME VALUE:");

// oneTimeFreeCredits.forEach((credits) => {
//   const conversations = Math.floor(
//     credits / conversationDetails.totalCostPerMinute
//   );
//   const trainings = Math.floor(credits / trainingDetails.totalTrainingCost);
//   const oneTimeCost = conversations * actualCostPerMinute;

//   console.log(`\n🎁 ${credits} One-Time Credits:`);
//   console.log(
//     `  User gets: ${conversations} conversation minutes OR ${trainings} trainings`
//   );
//   console.log(
//     `  Your cost: $${oneTimeCost.toFixed(2)} ONE-TIME (not monthly!)`
//   );

//   // Calculate LTV scenarios with different conversion rates
//   const conversionScenarios = [
//     {
//       rate: 0.01,
//       tier: "Plus",
//       monthlyProfit: plusProfitPerUser,
//       tierName: "Plus",
//     },
//     {
//       rate: 0.005,
//       tier: "Team",
//       monthlyProfit: teamProfitPerTeam,
//       tierName: "Team",
//     },
//     {
//       rate: 0.001,
//       tier: "Pro",
//       monthlyProfit: proProfitPerUser,
//       tierName: "Pro",
//     },
//   ];

//   console.log(`  Break-even scenarios:`);
//   conversionScenarios.forEach((scenario) => {
//     const monthsToBreakEven =
//       oneTimeCost / (scenario.rate * scenario.monthlyProfit);
//     const breakEvenConversion = oneTimeCost / scenario.monthlyProfit;

//     console.log(
//       `    ${scenario.tierName}: ${(scenario.rate * 100).toFixed(2)}% conversion = break-even in ${monthsToBreakEven.toFixed(1)} months | OR ${(breakEvenConversion * 100).toFixed(2)}% for immediate break-even`
//     );
//   });
// });

// console.log("\n🚀 ONE-TIME MODEL ADVANTAGES:");
// console.log("1. ✅ NO RECURRING COSTS - Pay once per user, not monthly");
// console.log("2. ✅ URGENCY CREATED - Users must convert before credits expire");
// console.log(
//   "3. ✅ SUSTAINABLE ECONOMICS - Even 1% conversion profitable long-term"
// );
// console.log("4. ✅ CLEAR VALUE PROP - 'Get X credits to try everything'");
// console.log("5. ✅ VIRAL POTENTIAL - Users share limited-time value");

// // Economic comparison
// console.log("\n💰 ECONOMIC COMPARISON (1000 new users):");
// const testUserCount = 1000;
// const monthlyModelCost = testUserCount * basicCostPerUser * 12; // 12 months
// const oneTimeModelCost = testUserCount * (35 * actualCostPerMinute); // 100 credits worth

// console.log(
//   `  Monthly recurring model: $${monthlyModelCost.toFixed(2)}/year (bleeds $${basicCostPerUser}/month per non-converter)`
// );
// console.log(
//   `  One-time credit model: $${oneTimeModelCost.toFixed(2)} total (zero ongoing costs)`
// );
// console.log(
//   `  Savings: $${(monthlyModelCost - oneTimeModelCost).toFixed(2)}/year (${(((monthlyModelCost - oneTimeModelCost) / monthlyModelCost) * 100).toFixed(1)}% reduction)`
// );

// // Conversion timeline analysis
// console.log("\n⏰ CONVERSION TIMELINE BENEFITS:");
// console.log("One-time model with 1% Plus conversion:");

// const timelineAnalysis = [
//   { months: 1, description: "Immediate" },
//   { months: 3, description: "Quarter 1" },
//   { months: 6, description: "6 months" },
//   { months: 12, description: "Year 1" },
// ];

// timelineAnalysis.forEach((period) => {
//   const oneTimeRevenue =
//     testUserCount * 0.01 * plusProfitPerUser * period.months;
//   const oneTimeCosts = oneTimeModelCost; // Same regardless of time
//   const oneTimeProfit = oneTimeRevenue - oneTimeCosts;

//   const monthlyRevenue =
//     testUserCount * 0.01 * plusProfitPerUser * period.months;
//   const monthlyCosts = testUserCount * basicCostPerUser * period.months;
//   const monthlyProfit = monthlyRevenue - monthlyCosts;

//   console.log(
//     `  ${period.description}: One-time model $${oneTimeProfit.toFixed(0)} vs Monthly model $${monthlyProfit.toFixed(0)} = $${(oneTimeProfit - monthlyProfit).toFixed(0)} better`
//   );
// });

// console.log("\n🎯 RECOMMENDED ONE-TIME STRATEGY:");
// console.log("• Give 75-100 credits on signup (enough for meaningful trial)");
// console.log("• Clear expiration timeline (30-60 days)");
// console.log("• Proactive conversion campaigns as credits run low");
// console.log("• Focus on team acquisition during trial period");
// console.log("• Consider credit 'top-ups' for engaged users who don't convert");

// // GROWTH PROJECTION ANALYSIS
// console.log("\n" + "=".repeat(80));
// console.log("📈 GROWTH PROJECTION: 0 → 5,000 USERS (One-Time Credit Model)");
// console.log("=".repeat(80));

// // Growth assumptions
// const growthAssumptions = {
//   oneTimeCreditCost: 3.26, // 100 credits
//   monthlyUserGrowth: 200, // New users per month
//   plusConversionRate: 0.015, // 1.5% (slightly optimistic)
//   proConversionRate: 0.002, // 0.2%
//   teamConversionRate: 0.005, // 0.5%
//   avgTeamSize: 5,
//   conversionDelayMonths: 2, // Users convert after 2 months on average
// };

// console.log("📊 Growth Assumptions:");
// console.log(`  • ${growthAssumptions.monthlyUserGrowth} new users/month`);
// console.log(
//   `  • 100 credits one-time ($${growthAssumptions.oneTimeCreditCost} cost per user)`
// );
// console.log(
//   `  • Conversion rates: Plus ${(growthAssumptions.plusConversionRate * 100).toFixed(1)}%, Pro ${(growthAssumptions.proConversionRate * 100).toFixed(1)}%, Team ${(growthAssumptions.teamConversionRate * 100).toFixed(1)}%`
// );
// console.log(
//   `  • Average conversion delay: ${growthAssumptions.conversionDelayMonths} months`
// );

// const maxMonths = 25; // To reach 5000 users (25 * 200 = 5000)
// const cumulativeData: Array<{
//   month: number;
//   newUsers: number;
//   totalUsers: number;
//   cumulativeCost: number;
//   newConversions: {
//     plus: number;
//     pro: number;
//     teams: number;
//   };
//   totalConversions: {
//     plus: number;
//     pro: number;
//     teams: number;
//   };
//   monthlyRevenue: number;
//   cumulativeRevenue: number;
//   netProfit: number;
// }> = [];

// console.log("\n💰 Month-by-Month Growth Projection:");
// console.log(
//   "Month".padEnd(6) +
//     "New".padEnd(6) +
//     "Total".padEnd(7) +
//     "Cost".padEnd(8) +
//     "+Plus".padEnd(7) +
//     "+Pro".padEnd(6) +
//     "+Teams".padEnd(8) +
//     "Monthly$".padEnd(10) +
//     "Total$".padEnd(9) +
//     "Profit".padEnd(8) +
//     "Status"
// );

// for (let month = 1; month <= maxMonths; month++) {
//   const newUsers = growthAssumptions.monthlyUserGrowth;
//   const totalUsers = month * newUsers;
//   const cumulativeCost = totalUsers * growthAssumptions.oneTimeCreditCost;

//   // Calculate conversions (users who signed up conversionDelayMonths ago)
//   const convertingUserMonth = month - growthAssumptions.conversionDelayMonths;
//   const newConversions =
//     convertingUserMonth > 0
//       ? {
//           plus: Math.floor(newUsers * growthAssumptions.plusConversionRate),
//           pro: Math.floor(newUsers * growthAssumptions.proConversionRate),
//           teams: Math.floor(newUsers * growthAssumptions.teamConversionRate),
//         }
//       : { plus: 0, pro: 0, teams: 0 };

//   // Calculate total conversions to date
//   const totalConversions = {
//     plus: 0,
//     pro: 0,
//     teams: 0,
//   };

//   for (let m = 1; m <= month; m++) {
//     const convMonth = m - growthAssumptions.conversionDelayMonths;
//     if (convMonth > 0) {
//       totalConversions.plus += Math.floor(
//         newUsers * growthAssumptions.plusConversionRate
//       );
//       totalConversions.pro += Math.floor(
//         newUsers * growthAssumptions.proConversionRate
//       );
//       totalConversions.teams += Math.floor(
//         newUsers * growthAssumptions.teamConversionRate
//       );
//     }
//   }

//   // Calculate revenue
//   const monthlyRevenue =
//     totalConversions.plus * plusProfitPerUser +
//     totalConversions.pro * proProfitPerUser +
//     totalConversions.teams * teamProfitPerTeam;

//   const cumulativeRevenue = monthlyRevenue * month; // Simplified - assumes steady state
//   const netProfit = cumulativeRevenue - cumulativeCost;
//   const isBreakEven = netProfit >= 0;

//   cumulativeData.push({
//     month,
//     newUsers,
//     totalUsers,
//     cumulativeCost,
//     newConversions,
//     totalConversions,
//     monthlyRevenue,
//     cumulativeRevenue,
//     netProfit,
//   });

//   // Display key milestones
//   if (month <= 12 || month % 3 === 0 || totalUsers >= 5000) {
//     console.log(
//       `${month}`.padEnd(6) +
//         `${newUsers}`.padEnd(6) +
//         `${totalUsers}`.padEnd(7) +
//         `$${Math.round(cumulativeCost)}`.padEnd(8) +
//         `+${newConversions.plus}`.padEnd(7) +
//         `+${newConversions.pro}`.padEnd(6) +
//         `+${newConversions.teams}`.padEnd(8) +
//         `$${Math.round(monthlyRevenue)}`.padEnd(10) +
//         `$${Math.round(cumulativeRevenue)}`.padEnd(9) +
//         `$${Math.round(netProfit)}`.padEnd(8) +
//         `${isBreakEven ? "✅ Profit" : "❌ Loss"}`
//     );
//   }
// }

// // Find break-even point
// const breakEvenMonth = cumulativeData.find((d) => d.netProfit >= 0);

// console.log("\n🎯 KEY MILESTONES:");
// if (breakEvenMonth) {
//   console.log(
//     `  🚀 Break-even: Month ${breakEvenMonth.month} (${breakEvenMonth.totalUsers} users)`
//   );
//   console.log(
//     `  💰 Revenue at break-even: $${Math.round(breakEvenMonth.cumulativeRevenue)}/month`
//   );
// } else {
//   console.log(`  ⚠️  Break-even not reached by month ${maxMonths}`);
// }

// const finalData = cumulativeData[cumulativeData.length - 1];
// console.log(`  📊 At 5,000 users (Month ${finalData.month}):`);
// console.log(
//   `      • Total subscribers: ${finalData.totalConversions.plus} Plus + ${finalData.totalConversions.pro} Pro + ${finalData.totalConversions.teams} Teams`
// );
// console.log(
//   `      • Monthly revenue: $${Math.round(finalData.monthlyRevenue)}`
// );
// console.log(`      • Net profit: $${Math.round(finalData.netProfit)}`);
// console.log(
//   `      • Profit margin: ${((finalData.netProfit / finalData.cumulativeRevenue) * 100).toFixed(1)}%`
// );

// // Annual projections
// console.log("\n📅 ANNUAL PROJECTIONS (at steady state):");
// const annualData = [
//   { year: 1, users: 2400 }, // 12 months * 200 users
//   { year: 2, users: 4800 }, // 24 months * 200 users
//   { year: 3, users: 7200 }, // 36 months * 200 users (extrapolated)
// ];

// annualData.forEach(({ year, users }) => {
//   const cost = users * growthAssumptions.oneTimeCreditCost;
//   const conversions = {
//     plus: Math.floor(users * growthAssumptions.plusConversionRate),
//     pro: Math.floor(users * growthAssumptions.proConversionRate),
//     teams: Math.floor(users * growthAssumptions.teamConversionRate),
//   };
//   const annualRevenue =
//     conversions.plus * plusProfitPerUser * 12 +
//     conversions.pro * proProfitPerUser * 12 +
//     conversions.teams * teamProfitPerTeam * 12;
//   const profit = annualRevenue - cost;

//   console.log(
//     `  Year ${year}: ${users} users → $${Math.round(annualRevenue)}/year revenue - $${Math.round(cost)} cost = $${Math.round(profit)} profit`
//   );
// });

// console.log("\n💡 GROWTH INSIGHTS:");
// console.log(
//   "🚀 One-time model enables sustainable growth without monthly bleed"
// );
// console.log("📈 Revenue compounds as subscriber base grows");
// console.log("💰 Break-even typically achieved within 12-18 months");
// console.log(
//   "🎯 Team conversions drive majority of revenue despite lower volume"
// );
// console.log("⚡ Focus on conversion rate optimization for exponential impact");

// // CONFIGURABLE GROWTH SCENARIOS
// console.log("\n" + "=".repeat(80));
// console.log("🎛️  CONFIGURABLE GROWTH SCENARIOS - Adjust Your Assumptions");
// console.log("=".repeat(80));

// console.log(
//   "💭 The previous projection assumed 200 users/month linear growth."
// );
// console.log(
//   "   Let's explore different growth patterns and see how they affect timeline:"
// );

// const growthScenarios = [
//   {
//     name: "Conservative Launch",
//     monthlyGrowth: 100,
//     description: "Slow, steady growth - good product-market fit validation",
//     targetUsers: 5000,
//   },
//   {
//     name: "Moderate Growth",
//     monthlyGrowth: 200,
//     description: "Balanced growth with some marketing spend",
//     targetUsers: 5000,
//   },
//   {
//     name: "Aggressive Growth",
//     monthlyGrowth: 400,
//     description: "Heavy marketing, viral growth, or strong word-of-mouth",
//     targetUsers: 5000,
//   },
//   {
//     name: "Startup Unicorn",
//     monthlyGrowth: 800,
//     description: "Exponential growth phase (unsustainable long-term)",
//     targetUsers: 5000,
//   },
// ];

// console.log("\n📈 Growth Timeline Comparison:");
// console.log(
//   "Scenario".padEnd(20) +
//     "Users/Month".padEnd(12) +
//     "Months to 5K".padEnd(15) +
//     "Break-even".padEnd(12) +
//     "Description"
// );
// console.log("-".repeat(80));

// growthScenarios.forEach((scenario) => {
//   const monthsTo5K = Math.ceil(scenario.targetUsers / scenario.monthlyGrowth);

//   // Calculate break-even with this growth rate
//   const conversionAssumptions = {
//     plusRate: 0.015,
//     proRate: 0.002,
//     teamRate: 0.005,
//     conversionDelay: 2,
//   };

//   // Find break-even month
//   let breakEvenMonth = null;
//   for (let month = 1; month <= monthsTo5K + 10; month++) {
//     const totalUsers = month * scenario.monthlyGrowth;
//     const cumulativeCost = totalUsers * 3.26; // $3.26 per user

//     // Calculate total conversions (accounting for delay)
//     const totalConversions = { plus: 0, pro: 0, teams: 0 };
//     for (let m = 1; m <= month; m++) {
//       const convMonth = m - conversionAssumptions.conversionDelay;
//       if (convMonth > 0) {
//         totalConversions.plus += Math.floor(
//           scenario.monthlyGrowth * conversionAssumptions.plusRate
//         );
//         totalConversions.pro += Math.floor(
//           scenario.monthlyGrowth * conversionAssumptions.proRate
//         );
//         totalConversions.teams += Math.floor(
//           scenario.monthlyGrowth * conversionAssumptions.teamRate
//         );
//       }
//     }

//     const monthlyRevenue =
//       totalConversions.plus * plusProfitPerUser +
//       totalConversions.pro * proProfitPerUser +
//       totalConversions.teams * teamProfitPerTeam;
//     const cumulativeRevenue = monthlyRevenue * month;
//     const netProfit = cumulativeRevenue - cumulativeCost;

//     if (netProfit >= 0 && !breakEvenMonth) {
//       breakEvenMonth = month;
//       break;
//     }
//   }

//   console.log(
//     scenario.name.padEnd(20) +
//       `${scenario.monthlyGrowth}`.padEnd(12) +
//       `${monthsTo5K} months`.padEnd(15) +
//       `${breakEvenMonth ? `Month ${breakEvenMonth}` : "Never"}`.padEnd(12) +
//       scenario.description
//   );
// });

// console.log("\n🎯 GROWTH ASSUMPTIONS EXPLAINED:");
// console.log(
//   "The '200 users/month' assumption was chosen as a MODERATE scenario because:"
// );
// console.log("  • 🚀 Early-stage SaaS typically grows 10-50% month-over-month");
// console.log("  • 📊 200/month = steady linear growth (not exponential)");
// console.log("  • 💰 Achievable with modest marketing spend ($2-5K/month)");
// console.log("  • 🎯 Allows 2+ year timeline to reach significant scale");
// console.log("  • ⚖️  Balances growth with sustainable unit economics");

// console.log("\n💡 REALISTIC GROWTH FACTORS:");
// console.log("Growth rate depends on:");
// console.log("  • Product-market fit strength");
// console.log("  • Marketing budget & channels");
// console.log("  • Viral coefficient & word-of-mouth");
// console.log("  • Competition & market saturation");
// console.log("  • Team size & execution speed");
// console.log("  • Pricing strategy effectiveness");

// console.log("\n🔧 HOW TO ADJUST FOR YOUR SITUATION:");
// console.log("Replace 'monthlyUserGrowth: 200' with your target based on:");
// console.log(
//   "  • 🎯 Your marketing budget: $1K = ~50-100 users, $5K = ~200-400 users"
// );
// console.log(
//   "  • 📈 Industry benchmarks: B2B SaaS typically 15-25% monthly growth"
// );
// console.log(
//   "  • 🧪 Early validation: Start conservative, increase as PMF improves"
// );
// console.log("  • 💸 Funding runway: Higher growth = higher burn rate");

// // Example with different growth patterns
// console.log("\n" + "=".repeat(80));
// console.log("📊 ALTERNATIVE GROWTH PATTERNS");
// console.log("=".repeat(80));

// console.log(
//   "The analysis above assumes LINEAR growth. Real startups often follow different patterns:"
// );

// const alternativePatterns = [
//   {
//     name: "Exponential Growth",
//     pattern: "Month 1: 50, Month 2: 75, Month 3: 113, Month 4: 169...",
//     description: "25% month-over-month growth (common for successful startups)",
//     formula: "users = 50 * (1.25^month)",
//   },
//   {
//     name: "S-Curve Growth",
//     pattern: "Slow start → rapid growth → plateau",
//     description: "Typical product lifecycle: adoption → growth → maturity",
//     formula: "Slow months 1-6, fast months 7-18, moderate months 19+",
//   },
//   {
//     name: "Stepped Growth",
//     pattern: "Growth spurts after major releases/campaigns",
//     description:
//       "Growth tied to product launches, funding, marketing campaigns",
//     formula: "100/month baseline + 500 spike months (3, 7, 12, 18)",
//   },
// ];

// alternativePatterns.forEach((pattern) => {
//   console.log(`\n🔄 ${pattern.name}:`);
//   console.log(`  Pattern: ${pattern.pattern}`);
//   console.log(`  Description: ${pattern.description}`);
//   console.log(`  Formula: ${pattern.formula}`);
// });

// console.log("\n🎯 TAKEAWAY:");
// console.log(
//   "The '200 users/month → 5000 users in 25 months' is just ONE scenario."
// );
// console.log(
//   "Adjust the monthlyUserGrowth parameter based on YOUR specific situation!"
// );
// console.log(
//   "Key insight: One-time credit model works across ALL growth patterns. 🚀"
// );
