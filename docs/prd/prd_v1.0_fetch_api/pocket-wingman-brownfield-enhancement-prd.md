# **Pocket Wingman Brownfield Enhancement PRD**

## **1. Intro Project Analysis and Context**

### **1.1 Existing Project Overview**

- **Analysis Source**: The analysis is based on the file tree and `package.json` you provided in our conversation.
- **Current Project State**: The project, "Pocket Wingman," is a cross-platform desktop chat application built with Electron and React. It uses the Matrix protocol for communication and features a rich text editor (Slate) and an AI Assistant for generating responses.

### **1.2 Enhancement Scope Definition**

- **Enhancement Type**: This is a **Major Feature Modification** and **Integration with a New System**.
- **Enhancement Description**: The project is to revamp the `gen-response` feature by refactoring the frontend components and integrating them with a new backend service at `https://pwai.vercel.app`.
- **Impact Assessment**: The impact on the existing codebase is **Moderate**, as it will involve changing the data flow and API calls for a specific, well-contained feature.

### **1.3 Goals and Background Context**

- **Goal**: To improve the performance, reliability, and maintainability of the AI 'Generate Response' feature by replacing the current implementation with a dedicated, robust backend service.
- **Background**: The new backend service was developed by another BMAD team and is ready for integration. This enhancement will bring the frontend implementation up to a production-ready standard.

---

## **2. Requirements**

### **Functional Requirements**

1.  **FR1**: The `gen-response` feature MUST send API requests to the new base URL: `https://pwai.vercel.app`.
2.  **FR2**: The request payload sent to the `/api/generate-response` endpoint MUST match the specified JSON structure, including the optional `message`, `context`, and `spec` fields.
3.  **FR3**: The frontend MUST correctly parse the JSON response (`{ "text": "..." }`) and display the `text` value in the user interface.
4.  **FR4**: The existing UI controls for persona and tone (`spec` object) MUST be correctly wired to provide their data to the new API call.
5.  **FR5**: The feature MUST handle an empty payload gracefully, as all API arguments are optional.

### **Non-Functional Requirements**

1.  **NFR1**: The refactored feature should be architected to allow for a future migration to a streaming API response with minimal rework.
2.  **NFR2**: User-perceived latency for a generated response should not be noticeably longer than the current "hacky" implementation.

### **Compatibility Requirements**

1.  **CR1**: This refactor MUST NOT negatively impact or break any other features within the AI Assistant or the wider application.

---

## **3. User Interface Enhancement Goals**

### **3.1 Integration with Existing UI**

The revamped `GeneratedResponseBox.tsx` component will be built following the project's established **Atomic Design** methodology. It will be styled using **Vanilla Extract** to ensure perfect visual consistency with the rest of the application.

### **3.2 Modified Screens and Views**

The specific component to be modified is the **`GeneratedResponseBox.tsx`** (located in `src/app/features/ai-assistant/gen-response/`). The scope of this work is limited to this component and does **not** include changes to the main `AIAssistant.tsx` dashboard in this iteration.

### **3.3 UI Consistency Requirements**

The primary goal is to **maintain the existing look and feel** of the feature. The modified component must reuse existing `atoms` and `molecules` wherever possible to ensure a seamless user experience.

---

## **4. Technical Constraints and Integration Requirements**

### **4.1 Existing Technology Stack**

The enhancement must be implemented using the project's existing technology stack, including **React**, **TypeScript**, **Jotai** for state management, and **Vanilla Extract** for styling.

### **4.2 Integration Approach**

- **API Integration**: The refactored logic will make a `POST` request to the new endpoint at `https://pwai.vercel.app/api/generate-response`.
- **Data Flow**: The component will gather the necessary `message`, `context`, and `spec` data from the UI, construct the JSON payload, and send it. Upon receiving the `{ "text": "..." }` response, it will update its state to display the suggested text.
- **Authentication**: No API key or authentication token is needed for this API call in this iteration.

### **4.3 Code Organization and Standards**

- The primary UI changes will be in the **`src/app/features/ai-assistant/gen-response/`** directory.
- The work will also require updates to centralized logic files, likely including **`src/app/features/ai-assistant/utils/ai.ts`** (for the API call logic) and **`src/app/features/ai-assistant/AIAssistantContext.tsx`** (to manage the shared state).

### **4.4 Deployment and Operations**

No changes are anticipated for the existing build and deployment process.

### **4.5 Risk Assessment and Mitigation**

- **Primary Risk**: The new backend endpoint could fail, time out, or return an error.
- **Mitigation**: The UI **must** include clear states for loading and for errors, managed within the `AIAssistantContext`.

---

## **5. Epic and Story Structure**

### **Epic 1: Revamp AI 'Generate Response' Feature** ✅ **COMPLETED**

- **Epic Goal**: To refactor the `gen-response` feature, integrating it with the new backend service to improve performance, reliability, and maintainability while preserving the existing user experience.
- **Status**: DONE
- **Completion Date**: October 13, 2025

### **Stories**

1.  **Story 1.1: Integrate New AI Backend Service** ✅ DONE
2.  **Story 1.2: Refactor `GeneratedResponseBox` to Use New AI Service** ✅ DONE
3.  **Story 1.3: Remove Old `gen-response` Implementation** ✅ DONE

---

## **6. Epic Completion Summary**

All three stories in Epic 1 have been successfully completed:

- ✅ **New API client** created and tested with comprehensive test coverage
- ✅ **UI components** refactored to use the new backend service at `https://pwai.vercel.app`
- ✅ **Old implementation** removed, leaving a clean, maintainable codebase
- ✅ **All persona and tone controls** properly wired to the new API
- ✅ **Build verification** confirms the application compiles without errors

The gen-response feature now uses the new backend service exclusively, with improved architecture ready for future enhancements like streaming responses.
