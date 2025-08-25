export interface UpdateRequestParams {
  requestId: string;
}
export interface UpdateRequestBody {
  status: 'approved' | 'denied';
}
