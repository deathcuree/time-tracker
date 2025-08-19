import { axiosInstance } from '../axios';

export type ExportStatus = 'pending' | 'approved' | 'denied' | 'all';

export interface ExportParams {
  search?: string;
  status?: ExportStatus;
  pagination?: boolean | string;
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
};

export default adminApi;