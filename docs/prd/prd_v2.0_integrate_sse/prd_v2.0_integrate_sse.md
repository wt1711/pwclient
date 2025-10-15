# Pocket Wingman Brownfield Enhancement PRD

## **1. Intro Project Analysis and Context**

### **1.1 Change Log**

| Date       | Version | Description                                               | Author |
| :--------- | :------ | :-------------------------------------------------------- | :----- |
| 2025-10-13 | 1.0     | Initial PRD for `gen-response` refactor.                  | BMad   |
| 2025-10-13 | 1.1     | Updated for SSE streaming API; replaced Epic 1 w/ Epic 2. | BMad   |

### **1.2 Existing Project Overview**

- **Analysis Source**: The analysis is based on the file tree and `package.json` you provided in our conversation.
- **Current Project State**: The project, "Pocket Wingman," is a cross-platform desktop chat application built with Electron and React. It uses the Matrix protocol for communication and features a rich text editor (Slate) and an AI Assistant for generating responses.

### **1.3 Enhancement Scope Definition**

- **Enhancement Type**: This is a **Major Feature Modification** and **Integration with a New System**.
- **Enhancement Description**: The project is to revamp the `gen-response` feature by refactoring the frontend components and integrating them with a new backend service at `https://pwai.vercel.app`.
- **Impact Assessment**: The impact on the existing codebase is **Moderate**, as it will involve changing the data flow and API calls for a specific, well-contained feature.

### **1.4 Goals and Background Context**

- **Goal**: To improve the performance, reliability, and maintainability of the AI 'Generate Response' feature by replacing the current implementation with a dedicated, robust backend service.
- **Background**: The new backend service was developed by another BMAD team and is ready for integration. This enhancement will bring the frontend implementation up to a production-ready standard.

---

## **2. Requirements**

### **Functional Requirements**

1.  **FR1**: The `gen-response` feature MUST send API requests to the new base URL: `https://pwai.vercel.app`.
2.  **FR2**: The request payload sent to the `/api/generate-response` endpoint MUST match the specified JSON structure, including the optional `message`, `context`, and `spec` fields.
3.  **FR3**: The frontend MUST correctly consume the Server-Sent Events (SSE) stream, appending text chunks in real-time to the UI.
4.  **FR4**: The existing UI controls for persona and tone (`spec` object) MUST be correctly wired to provide their data to the new API call.
5.  **FR5**: The feature MUST handle an empty payload gracefully, as all API arguments are optional.
6.  **FR6**: The frontend MUST listen for the `[DONE]` signal to correctly close the `EventSource` connection.

### **Non-Functional Requirements**

1.  **NFR1**: The implementation MUST use the `EventSource` API to handle the streaming response from the backend, providing a real-time user experience.
2.  **NFR2**: The UI must remain responsive while the data is streaming.

### **Compatibility Requirements**

1.  **CR1**: This refactor MUST NOT negatively impact or break any other features within the AI Assistant or the wider application.

---

## **3. User Interface Enhancement Goals**

### **3.1 Integration with Existing UI**

The revamped `GeneratedResponseBox.tsx` component will be built following the project's established **Atomic Design** methodology. It will be styled using **Vanilla Extract** to ensure perfect visual consistency with the rest of the application.

### **3.2 Modified Screens and Views**

The specific component to be modified is the **`GeneratedResponseBox.tsx`** (located in `src/app/features/ai-assistant/gen-response/`). The scope of this work is limited to this component and does **not** include changes to the main `AIAssistant.tsx` dashboard in this iteration.

### **3.3 UI Consistency Requirements**

The primary goal is to **maintain the existing look and feel** of the feature, with the addition of a real-time text rendering effect. The modified component must reuse existing `atoms` and `molecules` wherever possible.

---

## **4. Technical Constraints and Integration Requirements**

### **4.1 Existing Technology Stack**

The enhancement must be implemented using the project's existing technology stack, including **React**, **TypeScript**, **Jotai** for state management, and **Vanilla Extract** for styling.

### **4.2 Integration Approach**

- **API Integration**: The refactored logic will use the **`EventSource` API** to connect to the `https://pwai.vercel.app/api/generate-response` endpoint.
- **Data Flow**: The component will gather the necessary `message`, `context`, and `spec` data to initiate the `EventSource` connection. As text chunks arrive via the `onmessage` event, the component's state will be updated incrementally to produce a real-time typing effect in the UI.
- **Authentication**: No API key or authentication token is needed for this API call in this iteration.

### **4.3 Code Organization and Standards**

- The primary UI changes will be in the **`src/app/features/ai-assistant/gen-response/`** directory.
- The work will also require updates to centralized logic files, likely including **`src/app/features/ai-assistant/utils/ai.ts`** (for the API call logic) and **`src/app/features/ai-assistant/AIAssistantContext.tsx`** (to manage the shared state).

### **4.4 Deployment and Operations**

No changes are anticipated for the existing build and deployment process.

### **4.5 Risk Assessment and Mitigation**

- **Primary Risk**: The `EventSource` connection could fail or be interrupted.
- **Mitigation**: The UI **must** have clear states for loading (while the stream is active) and for errors (if the `onerror` event is triggered), managed within the `AIAssistantContext`.

---

## **5. Epic and Story Structure**

### **Epic 2: Migrate 'Generate Response' Feature to Streaming API**

- **Goal**: To refactor the implemented 'Generate Response' feature to use the new Server-Sent Events (SSE) streaming backend, creating a real-time "playground-like" user experience.

### **Stories**

1.  **Story 2.1: Implement SSE Client Logic**
    - _Replace the existing `fetch` call with the new `EventSource` logic as specified in the backend team's handoff document._
2.  **Story 2.2: Update UI State for Real-Time Rendering**
    - _Modify the component state (in `AIAssistantContext` or locally) to handle and append incoming text chunks from the `onmessage` event, creating the real-time typing effect._
3.  **Story 2.3: Implement Stream Finalization and Error Handling**
    - _Implement the logic to listen for the `[DONE]` signal to properly close the stream and add robust UI feedback for any `onerror` events._
