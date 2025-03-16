// This file is auto-generated by @hey-api/openapi-ts

export type Thread = {
    id: string;
    name: string;
    created_at: string;
};

export type ChatMessage = {
    /**
     * The text content of the message
     */
    content: string;
    /**
     * The role of the message sender
     */
    role?: 'user' | 'ai';
};

export type _Error = {
    code: string;
    message: string;
};

export type GetChatMessagesData = {
    body?: never;
    path: {
        /**
         * The unique identifier of the thread
         */
        thread_id: string;
    };
    query?: never;
    url: '/thread/{thread_id}/chat';
};

export type GetChatMessagesResponses = {
    /**
     * Chat messages
     */
    200: Array<ChatMessage>;
};

export type GetChatMessagesResponse = GetChatMessagesResponses[keyof GetChatMessagesResponses];

export type SubmitChatMessageData = {
    body: ChatMessage;
    path: {
        /**
         * The unique identifier of the thread
         */
        thread_id: string;
    };
    query?: never;
    url: '/thread/{thread_id}/chat';
};

export type SubmitChatMessageErrors = {
    /**
     * Invalid input
     */
    400: _Error;
};

export type SubmitChatMessageError = SubmitChatMessageErrors[keyof SubmitChatMessageErrors];

export type SubmitChatMessageResponses = {
    /**
     * Chat message response
     */
    200: ChatMessage;
};

export type SubmitChatMessageResponse = SubmitChatMessageResponses[keyof SubmitChatMessageResponses];

export type GetThreadsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/thread';
};

export type GetThreadsResponses = {
    /**
     * Threads
     */
    200: Array<Thread>;
};

export type GetThreadsResponse = GetThreadsResponses[keyof GetThreadsResponses];

export type CreateThreadData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/thread';
};

export type CreateThreadResponses = {
    /**
     * Thread created
     */
    200: Thread;
};

export type CreateThreadResponse = CreateThreadResponses[keyof CreateThreadResponses];

export type ClientOptions = {
    baseUrl: 'https://chat.chrissreesangkom.com/api' | 'http://localhost:8000' | (string & {});
};