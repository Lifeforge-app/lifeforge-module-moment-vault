export type EndpointEntriesRemove_OutputNO_CONTENT = void;
export type EndpointTranscribeCleanupTranscription_OutputOK = string;
export type EndpointTranscribeTranscribeExisted_OutputOK = string;
export type EndpointTranscribeTranscribeNew_OutputOK = string;

export interface Contract {
  entries: {
    create: EndpointEntriesCreate;
    list: EndpointEntriesList;
    remove: EndpointEntriesRemove;
    toggleReviewed: EndpointEntriesToggleReviewed;
    update: EndpointEntriesUpdate;
  };
  transcribe: {
    cleanupTranscription: EndpointTranscribeCleanupTranscription;
    transcribeExisted: EndpointTranscribeTranscribeExisted;
    transcribeNew: EndpointTranscribeTranscribeNew;
    updateTranscription: EndpointTranscribeUpdateTranscription;
  };
}
export interface EndpointEntriesCreate {
  method: "post";
  input: {
    body?: EndpointEntriesCreate_InputBody;
  };
  output: {
    CREATED: EndpointEntriesCreate_OutputCREATED;
  };
  media: {files: {multiple: true; optional: true}};
}
export interface EndpointEntriesCreate_InputBody {
  type: "text" | "audio" | "photos";
  content?: string;
  transcription?: string;
}
export interface EndpointEntriesCreate_OutputCREATED {
  id: string;
  type: string;
  file: string[];
  content: string;
  transcription: string;
  reviewed: boolean;
  created: string;
  updated: string;
}
export interface EndpointEntriesList {
  method: "get";
  input: {
    query?: EndpointEntriesList_InputQuery;
  };
  output: {
    OK: EndpointEntriesList_OutputOK;
  };
  media: null;
}
export interface EndpointEntriesList_InputQuery {
  page: string;
}
export interface EndpointEntriesList_OutputOK {
  items: {
    id: string;
    type: string;
    file: string[];
    content: string;
    transcription: string;
    reviewed: boolean;
    created: string;
    updated: string;
  }[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}
export interface EndpointEntriesRemove {
  method: "post";
  input: {
    query?: EndpointEntriesRemove_InputQuery;
  };
  output: {
    NO_CONTENT: EndpointEntriesRemove_OutputNO_CONTENT;
  };
  media: null;
}
export interface EndpointEntriesRemove_InputQuery {
  id: string;
}
export interface EndpointEntriesToggleReviewed {
  method: "post";
  input: {
    query?: EndpointEntriesToggleReviewed_InputQuery;
  };
  output: {
    OK: EndpointEntriesToggleReviewed_OutputOK;
  };
  media: null;
}
export interface EndpointEntriesToggleReviewed_InputQuery {
  id: string;
}
export interface EndpointEntriesToggleReviewed_OutputOK {
  id: string;
  type: string;
  file: string[];
  content: string;
  transcription: string;
  reviewed: boolean;
  created: string;
  updated: string;
}
export interface EndpointEntriesUpdate {
  method: "post";
  input: {
    query?: EndpointEntriesUpdate_InputQuery;
    body?: EndpointEntriesUpdate_InputBody;
  };
  output: {
    OK: EndpointEntriesUpdate_OutputOK;
  };
  media: null;
}
export interface EndpointEntriesUpdate_InputQuery {
  id: string;
}
export interface EndpointEntriesUpdate_InputBody {
  content: string;
}
export interface EndpointEntriesUpdate_OutputOK {
  id: string;
  type: string;
  file: string[];
  content: string;
  transcription: string;
  reviewed: boolean;
  created: string;
  updated: string;
}
export interface EndpointTranscribeCleanupTranscription {
  method: "post";
  input: {
    query?: EndpointTranscribeCleanupTranscription_InputQuery;
  };
  output: {
    OK: EndpointTranscribeCleanupTranscription_OutputOK;
  };
  media: null;
}
export interface EndpointTranscribeCleanupTranscription_InputQuery {
  id: string;
  newText?: string;
}
export interface EndpointTranscribeTranscribeExisted {
  method: "post";
  input: {
    query?: EndpointTranscribeTranscribeExisted_InputQuery;
  };
  output: {
    OK: EndpointTranscribeTranscribeExisted_OutputOK;
  };
  media: null;
}
export interface EndpointTranscribeTranscribeExisted_InputQuery {
  id: string;
}
export interface EndpointTranscribeTranscribeNew {
  method: "post";
  input: {};
  output: {
    OK: EndpointTranscribeTranscribeNew_OutputOK;
  };
  media: {file: {optional: false}};
}
export interface EndpointTranscribeUpdateTranscription {
  method: "post";
  input: {
    query?: EndpointTranscribeUpdateTranscription_InputQuery;
    body?: EndpointTranscribeUpdateTranscription_InputBody;
  };
  output: {
    OK: EndpointTranscribeUpdateTranscription_OutputOK;
  };
  media: null;
}
export interface EndpointTranscribeUpdateTranscription_InputQuery {
  id: string;
}
export interface EndpointTranscribeUpdateTranscription_InputBody {
  transcription: string;
}
export interface EndpointTranscribeUpdateTranscription_OutputOK {
  id: string;
  type: string;
  file: string[];
  content: string;
  transcription: string;
  reviewed: boolean;
  created: string;
  updated: string;
}
