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

# Current Codebase Analysis

## Existing Components
Based on my analysis of the current codebase:

### Current Components (src/components/)
- **OpenAIChat** (`openai-chat.tsx:389-807`): Main role-playing simulation component with complex state management, desktop/mobile layouts
- **MentorAgent** (`mentor-agent.tsx:21-173`): Simplified agent component using Voice Agents SDK
- **SpeakingBubble** (`speaking-bubble.tsx:24-350`): Audio visualization component with complex animation logic

### Current Hooks (src/hooks/)
- **useOpenAIRealtime** (`use-openai-realtime.ts:92-393`): Low-level realtime SDK integration with WebRTC
- **useOpenAIAgents** (`use-openai-agents.ts:31-356`): High-level Voice Agents SDK wrapper
- **useMicrophone** (`use-microphone.ts:15-207`): Microphone permission and stream management
- **useTranscriptSave** (`use-transcript-save.ts:11-98`): Periodic transcript saving to database
- **useRealtimeUsageTracking** (`use-realtime-usage-tracking.ts:16-104`): Usage metrics tracking

### Current Contexts (src/contexts/)
- **TranscriptProvider** (`transcript.tsx:37-120`): In-memory transcript state management
- **SimulationCustomizationProvider**: Skills/traits override management

### Current Prompts (src/prompts/)
- **role-playing-agent.ts**: Creates RealtimeAgent for role-play simulations
- **module-creator-agent.ts**: Agent for creating new training modules with tools
- **prep-coach-agent.ts**: Agent for preparation coaching with note-taking
- **training-navigator-agent.ts**: Agent for training navigation and recommendations

## Missing Considerations

### 1. Provider Abstraction Layer
The current implementation tightly couples UI components to specific SDK implementations. We need:
- **RealtimeProvider interface**: Abstract provider contract
- **OpenAIRealtimeProvider**: Implementation using the Realtime SDK
- **Provider configuration**: Configuration object for providers

### 2. Enhanced Configuration Types
Current prompt structure is mixed between different SDKs. We need:
- **VoicePrompt type**: Unified prompt structure with voice, tools, and instructions
- **RealtimeConfig interface**: Complete configuration including provider selection
- **MessageItem type**: Generic message format for different message types

### 3. Enhanced State Management
Current state is scattered across multiple hooks. We need:
- **Connection state standardization**: Unified connection state (Stopped, Starting, Connected, Started)
- **Error handling**: Centralized error handling with specific error types
- **State synchronization**: Better sync between hook and component states

### 4. Tool Integration Architecture
Current tool usage is inconsistent between agents. We need:
- **Tool execution framework**: Unified tool execution in the new architecture
- **Tool configuration**: How tools are defined and passed to providers
- **Function call handling**: Generic function call handling in useRealtime

### 5. Usage and Metrics Architecture
Current usage tracking is provider-specific. We need:
- **Generic usage interface**: Provider-agnostic usage tracking
- **Usage aggregation**: How different providers report usage
- **Session management**: Unified session lifecycle management

### 6. Testing Strategy
The refactor needs comprehensive testing approach:
- **Component testing**: VoiceChat component with mocked providers
- **Hook testing**: useRealtime with different provider implementations
- **Integration testing**: End-to-end flows with real providers


### 7. Developer Experience
The new architecture should improve maintainability:
- **TypeScript coverage**: Full type safety across the new components
- **Documentation**: Clear documentation for the new architecture
- **Examples**: Usage examples for different scenarios
- **Debugging**: Better debugging capabilities and error messages

# Enhanced Architecture Details

## Core Interfaces

```typescript
interface RealtimeProvider {
  connect(stream: MediaStream): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: MessageItem): Promise<void>;
  getUsage(): RealtimeUsage | null;
  onStateChange(callback: (state: ConnectionState) => void): void;
  onError(callback: (error: RealtimeError) => void): void;
}

interface RealtimeConfig {
  provider: 'openai' | 'elevenlabs'; // extensible
  voice: VoicePrompt;
  audioRef: React.RefObject<HTMLAudioElement>;
  userName: string;
  enableTranscription?: boolean;
  enableUsageTracking?: boolean;
}

interface VoicePrompt {
  instructions: string;
  voice: string;
  displayName: string;
  tools?: ToolDefinition[];
  toolFunctions?: Record<string, Function>;
}

interface MessageItem {
  type: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

type ConnectionState = 'stopped' | 'starting' | 'connected' | 'started';
```

## Component Hierarchy
```
RolePlaySimulation / MentorAgent (containers)
├── UsageProvider
│   └── TranscriptProvider (optional)
│       └── VoiceChat
│           ├── SpeakingBubble
│           ├── Start/Stop buttons
│           ├── Mute/Unmute buttons
│           ├── ChatTextEntry (optional)
│           ├── StopConversationDialog
│           └── NoCreditsDialog
```

## Hook Dependencies
```
VoiceChat
├── useRealtime(config) -> provider abstraction
├── useMicrophone() -> audio input management
├── useTranscript() -> transcript state (optional)
├── useTimer(countdownFrom) -> session timing (optional)
└── useUsage() -> usage tracking (optional)
```

# Incremental Implementation Plan
This is a plan on how to implement this incrementally in phases where each phase is working and can be tested before moving to the next phase.

## Phase 1: Foundation & Core Interfaces 
**Goal**: Establish the foundation types and provider abstraction without breaking existing functionality.

### Tasks:
1. **Create Core Types** (`src/types/realtime.ts`)
   - Define `RealtimeProvider` interface
   - Define `RealtimeConfig`, `VoicePrompt`, `MessageItem` types
   - Define `ConnectionState`, `RealtimeUsage`, `RealtimeError` types
   
2. **Create OpenAIRealtimeProvider** (`src/providers/openai-realtime-provider.ts`)
   - Implement `RealtimeProvider` interface wrapping current `useOpenAIRealtime` logic
   - Maintain exact same functionality as current implementation
   - Add comprehensive error handling and state management
   
3. **Create useRealtime Hook** (`src/hooks/use-realtime.ts`)
   - Generic hook that uses provider instances
   - Initially only support OpenAI provider
   - Maintain API compatibility with current `useOpenAIRealtime`

### Testing:
- Unit tests for provider interface
- Integration tests with existing OpenAIChat component
- Verify no regressions in current functionality

### Success Criteria:
- All existing functionality works unchanged
- New provider can be instantiated and connected
- useRealtime hook passes all current useOpenAIRealtime tests

## Phase 2: VoiceChat Component Implementation 
**Goal**: Create the unified VoiceChat component that can replace both OpenAIChat's core functionality and MentorAgent.

### Tasks:
1. **Create VoiceChat Component** (`src/components/voice-chat.tsx`)
   - Extract common UI elements from OpenAIChat and MentorAgent
   - Implement connection state management (Stopped, Starting, Connected, Started)
   - Integrate with SpeakingBubble, buttons, and dialogs
   - Support optional ChatTextEntry and countdown timer
   
2. **Create Enhanced Usage Provider** (`src/contexts/usage-context.tsx`)
   - Provider-agnostic usage tracking
   - Integration with existing usage tracking infrastructure
   
3. **Update Prompt Structure** (`src/prompts/`)
   - Convert role-playing-agent to use new VoicePrompt format
   - Ensure backward compatibility with current prompts
   - Maintain tool integration for agents that use tools

### Testing:
- Component testing for VoiceChat with mocked providers
- Visual regression testing for UI components
- Accessibility testing for screen readers and keyboard navigation

### Success Criteria:
- VoiceChat component renders correctly with OpenAI provider
- All button interactions work (start/stop, mute/unmute)
- SpeakingBubble integrates properly
- Connection states display correctly

## Phase 3: Container Component Migration
**Goal**: Create new RolePlaySimulation component and update MentorAgent to use VoiceChat.

### Tasks:
1. **Create RolePlaySimulation Component** (`src/components/role-play-simulation.tsx`)
   - Rename and refactor OpenAIChat content into RolePlaySimulation
   - Use VoiceChat component instead of embedded logic
   - Maintain existing mobile/desktop layouts
   - Integrate with SimulationContentTabs and customization dialogs
   
2. **Refactor MentorAgent Component** (`src/components/mentor-agent-v2.tsx`)
   - Replace useOpenAIAgents logic with VoiceChat component
   - Maintain existing agent factory pattern
   - Ensure tool execution still works properly
   

### Success Criteria:
- RolePlaySimulation works identically to current OpenAIChat
- MentorAgent functionality is preserved with cleaner architecture

## Phase 4: Provider Extension & Optimization
**Goal**: Clean up the architecture, remove deprecated code, and prepare for future provider extensions.

### Tasks:
1. **Remove OpenAI Voice Agents SDK Dependencies**
   - Remove all references to `@openai/agents/realtime`
   - Update package.json to remove unused dependencies
   - Clean up any remaining Voice Agents specific code
   
2. **Optimize Bundle Size**
   - Tree-shake unused realtime code
   - Lazy load provider implementations
   - Optimize audio processing components
   
3. **Prepare Extension Points** (for future)
   - Create provider registration system
   - Document provider interface for future implementations
   - Add configuration validation for different providers

### Testing:
- Bundle size analysis
- Performance benchmarking
- Memory usage profiling
- Production testing with real users

### Success Criteria:
- Bundle size is same or smaller than before refactor
- No Voice Agents dependencies remain
- Code is prepared for easy future provider additions
- All tests pass and performance is maintained

## Phase 5: Production Rollout & Cleanup
**Goal**: Complete migration, remove deprecated code, and establish monitoring.

### Tasks:
1. **Complete Migration**
   - Remove original OpenAIChat component
   - Remove useOpenAIAgents hook
   - Update all import references
   - Remove feature flags once rollout is complete
   
2. **Documentation & Examples**
   - Document new VoiceChat component API
   - Create usage examples for different scenarios  
   - Update architecture documentation
   - Add troubleshooting guides
   
3. **Monitoring & Analytics**
   - Add metrics for new component usage
   - Monitor error rates and connection success
   - Track performance metrics
   - Set up alerts for issues

### Testing:
- Full regression testing suite
- User acceptance testing
- Production monitoring setup
- Rollback procedure testing

### Success Criteria:
- All users migrated to new architecture
- Deprecated components removed
- Monitoring shows stable performance
- Team is trained on new architecture

## Risk Mitigation

### Technical Risks:
1. **Audio Processing Issues**: Maintain exact same audio pipeline, test thoroughly
2. **State Synchronization**: Carefully manage connection state across components
3. **Performance Regression**: Continuous benchmarking throughout refactor
4. **Tool Execution**: Ensure agent tools continue working with new architecture

### User Experience Risks:
1. **UI Consistency**: Visual regression testing and careful state management
2. **Feature Parity**: Comprehensive testing against current functionality
3. **Accessibility**: Screen reader testing and keyboard navigation validation

### Rollback Strategy:
- Feature flags allow immediate rollback to previous implementation
- Database schema remains compatible throughout migration
- Monitoring alerts trigger automatic rollback if error rates spike
- Manual rollback procedure documented and tested

## Success Metrics:
- Zero functionality regressions
- Bundle size maintained or reduced
- Performance metrics stable or improved
- Code maintainability significantly improved
- Team velocity increased for future realtime features
- Foundation established for multi-provider support