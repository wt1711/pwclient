# **2. Requirements**

## **Functional Requirements**

1.  **FR1**: The `gen-response` feature MUST send API requests to the new base URL: `https://pwai.vercel.app`.
2.  **FR2**: The request payload sent to the `/api/generate-response` endpoint MUST match the specified JSON structure, including the optional `message`, `context`, and `spec` fields.
3.  **FR3**: The frontend MUST correctly consume the Server-Sent Events (SSE) stream, appending text chunks in real-time to the UI.
4.  **FR4**: The existing UI controls for persona and tone (`spec` object) MUST be correctly wired to provide their data to the new API call.
5.  **FR5**: The feature MUST handle an empty payload gracefully, as all API arguments are optional.
6.  **FR6**: The frontend MUST listen for the `[DONE]` signal to correctly close the `EventSource` connection.

## **Non-Functional Requirements**

1.  **NFR1**: The implementation MUST use the `EventSource` API to handle the streaming response from the backend, providing a real-time user experience.
2.  **NFR2**: The UI must remain responsive while the data is streaming.

## **Compatibility Requirements**

1.  **CR1**: This refactor MUST NOT negatively impact or break any other features within the AI Assistant or the wider application.

---
