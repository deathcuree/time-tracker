import { axiosInstance } from '../axios';

export type ExportStatus = 'pending' | 'approved' | 'denied' | 'all';

export interface ExportParams {
  search?: string;
  status?: ExportStatus;
  pagination?: boolean | string;
}

export type AdminTimeStatus = 'all' | 'active' | 'completed';

export interface TimeLogsParams {
  search?: string;
  status?: AdminTimeStatus;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  tzOffset?: string;
  page?: number;
  limit?: number;
}

export interface TimeLogUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TimeLogItem {
  _id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  user: TimeLogUser;
  hours: number;
  status: 'active' | 'completed';
}

export interface TimeLogsResponse {
  items: TimeLogItem[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export const adminApi = {
  exportTableData: async (params: ExportParams = {}): Promise<{ blob: Blob; filename: string }> => {
    const finalParams: any = { ...params };
    if (finalParams.pagination === undefined) finalParams.pagination = false;

    const response = await axiosInstance.get('/admin/table/export', {
      params: finalParams,
      responseType: 'blob',
    });

    const disposition = (response.headers as any)['content-disposition'] || (response.headers as any)['Content-Disposition'];
    let filename = `table-export-${new Date().toISOString().slice(0,10)}.xlsx`;
    if (disposition) {
      const match = /filename\*?=(?:UTF-8''|")?([^;"]+)/i.exec(disposition);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }
    }

    return { blob: response.data as Blob, filename };
  },

  exportTimeLogs: async (params: TimeLogsParams = {}): Promise<{ blob: Blob; filename: string }> => {
    const finalParams: any = {};
    if (params.search) finalParams.search = params.search;
    if (params.status) finalParams.status = params.status;
    if (typeof params.month === 'number') finalParams.month = String(params.month);
    if (typeof params.year === 'number') finalParams.year = String(params.year);
    if (params.startDate) finalParams.startDate = params.startDate;
    if (params.endDate) finalParams.endDate = params.endDate;
    // Ensure backend can mirror frontend timezone formatting
    finalParams.tzOffset = String(new Date().getTimezoneOffset());

    const response = await axiosInstance.get('/admin/time/logs/export', {
      params: finalParams,
      responseType: 'blob',
    });

    const disposition = (response.headers as any)['content-disposition'] || (response.headers as any)['Content-Disposition'];
    let filename = `time-logs-${new Date().toISOString().slice(0,10)}.xlsx`;
    if (disposition) {
      const match = /filename\*?=(?:UTF-8''|")?([^;"]+)/i.exec(disposition);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }
    }

    return { blob: response.data as Blob, filename };
  },

  getTimeLogs: async (params: TimeLogsParams = {}): Promise<TimeLogsResponse> => {
    const finalParams: any = {};
    if (params.search) finalParams.search = params.search;
    if (params.status) finalParams.status = params.status;
    if (typeof params.month === 'number') finalParams.month = String(params.month);
    if (typeof params.year === 'number') finalParams.year = String(params.year);
    if (params.startDate) finalParams.startDate = params.startDate;
    if (params.endDate) finalParams.endDate = params.endDate;
    if (params.page) finalParams.page = String(params.page);
    if (params.limit) finalParams.limit = String(params.limit);

    const response = await axiosInstance.get<TimeLogsResponse>('/admin/time/logs', { params: finalParams });
    return response.data;
  },
};

export default adminApi;