import * as XLSX from 'xlsx';
import PTORequest from '../../modules/pto/pto.model.js';
import TimeEntry from '../../modules/time/time.model.js';

export const ReportService = {
  exportPTORequestsToXLSX: async (params: {
    search?: string;
    status?: 'pending' | 'approved' | 'denied' | 'all';
  }): Promise<{ buffer: Buffer; filename: string }> => {
    const { search, status } = params;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
    ];

    if (status && status !== 'all') {
      pipeline.push({ $match: { status } });
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchStr = search.toLowerCase().trim();

      const orConditions: any[] = [
        { reason: { $regex: searchStr, $options: 'i' } },
        { status: { $regex: searchStr, $options: 'i' } },
        { 'userDetails.firstName': { $regex: searchStr, $options: 'i' } },
        { 'userDetails.lastName': { $regex: searchStr, $options: 'i' } },
        { 'userDetails.email': { $regex: searchStr, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: { $dateToString: { date: '$date', format: '%Y-%m-%d' } },
              regex: searchStr,
              options: 'i',
            },
          },
        },
      ];

      const numeric = Number(searchStr);
      if (!Number.isNaN(numeric)) {
        orConditions.push({ hours: numeric });
      }

      pipeline.push({ $match: { $or: orConditions } });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const requests = await PTORequest.aggregate(pipeline);

    const rows = requests.map((r: any) => ({
      Employee: `${r.userDetails?.firstName ?? ''} ${r.userDetails?.lastName ?? ''}`.trim(),
      Date: new Date(r.date).toISOString().split('T')[0],
      Hours: r.hours,
      Reason: r.reason,
      Status:
        String(r.status || '')
          .charAt(0)
          .toUpperCase() + String(r.status || '').slice(1),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ['Employee', 'Date', 'Hours', 'Reason', 'Status'],
    });
    XLSX.utils.book_append_sheet(wb, ws, 'Export');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

    const today = new Date().toISOString().slice(0, 10);
    const filename = `table-export-${today}.xlsx`;

    return { buffer, filename };
  },

  exportTimeLogsXLSX: async (params: {
    search?: string;
    status?: 'all' | 'active' | 'completed';
    month?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
    tzOffset?: string;
  }): Promise<{ buffer: Buffer; filename: string }> => {
    const { search = '', status = 'all', month, year, startDate, endDate, tzOffset } = params;

    const tzOffsetMinutes = Number(tzOffset ?? '0');
    const toLocal = (d?: Date | null) => {
      if (!d) return null;
      const ms = new Date(d).getTime();
      return new Date(ms - tzOffsetMinutes * 60 * 1000);
    };
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const formatDateLocal = (d?: Date | null) => {
      if (!d) return '';
      const ld = toLocal(d)!;
      const yyyy = ld.getUTCFullYear();
      const mmm = monthNames[ld.getUTCMonth()];
      const dd = String(ld.getUTCDate()).padStart(2, '0');
      return `${mmm} ${dd}, ${yyyy}`;
    };
    const formatTimeLocal = (d?: Date | null) => {
      if (!d) return '';
      const ld = toLocal(d)!;
      let hours = ld.getUTCHours();
      const minutes = ld.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const mm = String(minutes).padStart(2, '0');
      return `${hours}:${mm} ${ampm}`;
    };
    const formatHoursWorked = (hours?: number | null) => {
      if (typeof hours !== 'number' || isNaN(hours)) return '0 mins';
      const totalMinutes = Math.round(hours * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      const parts: string[] = [];
      if (h > 0) parts.push(`${h} hr${h === 1 ? '' : 's'}`);
      if (m > 0) parts.push(`${m} min${m === 1 ? '' : 's'}`);
      return parts.length > 0 ? parts.join(' ') : '0 mins';
    };

    const match: any = {};

    let rangeStart: Date | undefined;
    let rangeEnd: Date | undefined;

    if (year !== undefined && month !== undefined) {
      const y = Number(year);
      const m = Number(month);
      rangeStart = new Date(y, m, 1, 0, 0, 0, 0);
      rangeEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
    }

    if (rangeStart && rangeEnd) {
      match.date = { $gte: rangeStart, $lte: rangeEnd };
    }

    if (status === 'active') {
      match.clockOut = null;
    } else if (status === 'completed') {
      match.clockOut = { $ne: null };
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $sort: { date: -1, clockIn: -1 } },
      {
        $project: {
          _id: 1,
          date: 1,
          clockIn: 1,
          clockOut: 1,
          user: {
            _id: '$user._id',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            email: '$user.email',
          },
          hours: {
            $round: [
              {
                $divide: [
                  {
                    $subtract: [
                      {
                        $cond: [{ $eq: ['$clockOut', null] }, '$$NOW', '$clockOut'],
                      },
                      '$clockIn',
                    ],
                  },
                  1000 * 60 * 60,
                ],
              },
              2,
            ],
          },
          status: {
            $cond: [{ $eq: ['$clockOut', null] }, 'active', 'completed'],
          },
        },
      },
    ];

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchStr = search.trim();
      pipeline.splice(3, 0, {
        $match: {
          $or: [
            { 'user.firstName': { $regex: searchStr, $options: 'i' } },
            { 'user.lastName': { $regex: searchStr, $options: 'i' } },
            { 'user.email': { $regex: searchStr, $options: 'i' } },
            {
              $expr: {
                $regexMatch: {
                  input: { $dateToString: { date: '$date', format: '%Y-%m-%d' } },
                  regex: searchStr,
                  options: 'i',
                },
              },
            },
          ],
        },
      });
    }

    const items = await TimeEntry.aggregate(pipeline);

    const rows = items.map((item: any) => {
      const name = `${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`.trim();
      return {
        Employee: name,
        Email: item.user?.email ?? '',
        Date: item.date ? formatDateLocal(item.date) : '',
        'Clock In': item.clockIn ? formatTimeLocal(item.clockIn) : '',
        'Clock Out': item.clockOut ? formatTimeLocal(item.clockOut) : '',
        'Hours Worked': formatHoursWorked(item.hours),
        Status:
          String(item.status || '')
            .charAt(0)
            .toUpperCase() + String(item.status || '').slice(1),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ['Employee', 'Email', 'Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Status'],
    });
    XLSX.utils.book_append_sheet(wb, ws, 'Time Logs');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

    let filename: string;
    if (year !== undefined && month !== undefined) {
      const y = Number(year);
      const m = Number(month) + 1;
      filename = `time-logs-${y}-${String(m).padStart(2, '0')}.xlsx`;
    } else {
      const today = new Date().toISOString().slice(0, 10);
      filename = `time-logs-${today}.xlsx`;
    }

    return { buffer, filename };
  },
};
