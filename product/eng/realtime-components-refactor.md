# Problem
Currently we are using 2 separate components and code paths for the Realtime voice conversation UI. One is the OpenAIChat component that use the useOpenAIRealtime hook (which in turn uses the OpenAI Realtime SDK) and the other is the MentorAgent component which use the useOpenAIAgents components (which in turn use the higher abstraction level OpenAI Voice Agents SDK). The UI code is 
1. too much tied into the specifics of the 2 SDKs and they are not well abstracted away -- i.e. wrong abstraction level 
2. We use 2 separate SDKs for the realtime communication logic, and the VoiceSDK is a very leaky abstraction and especially in its latest iteration very buggy

# Goals
1. Come up with a single UI component that is not tied to the implementation details of the realtime communication, and can be re-used across the app and also with different implementations of communicating with backend voice models provided by different vendors.
2. For OpenAI realtime communication provider, create a reusable abstraction that can be used by the UI component. 
3. Use only the Realtime SDK from OpenAI and remove all dependencies to the OpenAI Voice Agents.

# Non Goals
1. Create different communication providers for different vendors. Only use OpenAI still. But the abstraction is well enough that we can create those providers in the future.
2. Create a new user experience. We will keep the same user experience and just focus on the refactoring. No new user features

# Features
## User Experience
* We want to keep the same user experience and features. This should be just a refactoring so that we have a better architecture and well layered reusable components and providers.

## Overall Architecture
The containers (app layer setup, layout etc) are the RolePlaySimulation and MentorAgent components. 

When initiated they are provided with UsageProvider and TranscriptProvider(optional) For example for a RolePlaySimulation it is:
<UsageProvider>
  <TranscriptProvider>
    <VoiceChat> ... other components necessary
  </TranscriptProvider>
<UsageProvider>

VoiceChat component instantiates a useRealtime hook (with the correct provider, like OpenAIRealtime). useRealtime hook is very generic and provides a generic interface to control and retrieve realtime interaction, all the SDK specific handling happens in the provider such as OpenAIRealtime. 

useRealtimeHook uses the interface provided by the Transcript and Usage provider to keep track of the transcript of the conversation and token usage. 

The containers (RolePlaySimulation and MentorAgent) triggers and handles the saving of the transcription to the database using the right actions.

All the configuration of the realtime is provided by an interface called RealtimeConfig.

## Components
### RolePlaySimulation
The current OpenAIChat component will be renamed into RolePlaySimulation. This will be responsible for the layout and overall functionality of the role play simulations for both mobile and desktop (with Reactive UI)

*Input Parameters*
* module (of type Module) which contains the data of the module to be simulated
* currentUser (of type User)
* notes (of type TrainingNote) this will be provided instead of retrieved in the component.

This component will use:
* VoiceChat component providing onStop and onStopAndSave handlers. 
* Just like in the existing UIs for mobile and desktop, it will provide SimulationContentTabs. 
* Just like in the existing UIs for mobile and desktop, it will provide the CountdownBar, SkillsDialog and TraitsDialog
* Instantiate the useTranscriptSave hook to save the transcripts periodically or based on 


### MentorAgent
The current MentorAgent component but refactored. It will use the VoiceChat component but does not require transcription

*Input Parameters*
* prompt of the new PromptType

### VoiceChat
We will merge the parts within OpenAIChat and MentorAgent components into a single component called VoiceChat. The OpenAIChat will rename into RolePlaySimulation and the MentorAgent will keep the same name.

VoiceChat will encapsulate the following features:
* Display the SpeakingBubble component and ensure that 1) it is hooked up to the incoming audio to display its animations, 2) It is provided with the correct avatar image to be shown within the bubble. No changes will be made to the SpeakingBubble.
* The Start/Stop conversation buttons and the Mute Microphone buttons.
* Optional ChatTextEntry to be able to send text messages instead of voice.
* StopConversationDialog (renamed from EndChatDialog) with one required onStop handler (renamed from onEndChat) and one optional onStopAndSave handler (renamed from onEndAndSave). If the optional handler is not provided than the dialog does not show to option of saving. isTimeout is also an optional parameter.
* NoCreditsDialog

The conversation UI state is going to be encapsulated in this component. States are Stopped, Starting, Connected, Started. When Connected, the Avatar should be shown in the SpeakingBubble.

*Input Parameters*
* 
* onStop and optional onStopAndSave handlers
* realtimeProvider: This parameter specifies which realtimeProvider (OpenAI, and in the future things like ElevenLabs etc) to use. This parameter is passed on to the useRealtime hook to instantiate the right provider.
* VoiceChat will optionally make use of useTimer hook with a countdown to timebox a conversation. This option is enabled with an optional parameter called countdownFrom which accepts the number of minutes to coundown from(e.g. 5 means, countdown from 5min to 0)

Internally:
* Use the useMicrophone hook to start the audio input
* Use the useTranscript hook to optionally to start the internal representation of transcript history. This is provided by the TranscriptProvider

## Hooks
### useRealtime Hook
This is a generalized version of the use-openai-realtime hook. It is going to abstract out the details of the OpenAI Realtime SDK. Initially it will only use the useOpenAIRealtime hook as its provider but later we will potentially release other providers.


*Input Parameters*
* Which backend provider (OpenAI, ElevenLabs, ..) to use. The default will be OpenAI (for now only to be implemented)
* config of type RealtimeConfig. This should contain 
  * all the prompt including the tool use and the tool use functions. (new VoicePrompt type)
  * voice (the name to be used for the voice) and the displayName of the agent
  * user name
* audioRef (as before). This provides the input audio

*Returns*
* connect method to connect to the Realtime provider
* disconnect method to disconnect from it
* sendMessage to send messages to the backend. This need to be more generic, should be able to handle system and regular text message with a MessageItem type
* usage of type RealtimeUsage. 

Internally it works as:
* Select the correct provider as provided in the input realtimeProvider (defaults and implemented for OpenAIRealtime for now)


### Transcript Provider
This is a provider that keeps track of an in memory representation of the transcript of the conversation and provides methods to save it to the database when it is called. 

### Usage Provider
This is a provider that keeps track of the usage in memory and provides methods to save it to the database when called.

## Prompts and Agent Definitions
Currently we have the prompts and agent definitions in the prompts folder. Because we were using 2 different SDKs (low level Realtime and higher level Agents), the prompt structure is mixed. The new prompt structure should include the voice name, and tool use with the function that executes the tool. When we pass this into the useRealtime, it will be able to use it to execute tool calls as well

Our Voice application has currently these prompts:

### Onboarding Agent & Prompt 
We will split this (training-navigator-agents.ts) prompt instead of relying on hand-offs as currently the case

Onboarding agent and prompt: This will be called immediately after the onboarding finishes, greet the user and walk the user through an example training by introducing the training.

### Module Creator Agent & Prompt
This will be a dedicated one. Currently it is in module-creator-agent.ts file. It will be used to help the user create a new Sidequest module. The functionilty is the same and it is directly launched from the GoPanda button

### PrepCoach Agent & Prompt
This is in prep-coach-agent.ts file. Will remain largely the same, just adopt to the new format.

### Role Playing Agent & Prompt
This is the role playing simulation prompt. Again adopt it to the new format. It is currently in role-playing-agent.ts

# Incremental Implementation Plan
This is a plan on how to implement this incrementally in phases where each phase is working and can be tested before moving to the next phase