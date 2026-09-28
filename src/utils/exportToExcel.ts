import type { Task, Project } from '../types';
import { 
  formatTimeDisplay, 
  calculateDuration, 
  calculateTotalDuration, 
  normalizeTaskTimeSlots, 
  getTaskOverallStatus 
} from './dateUtils';

export function exportTasksToExcel(tasks: Task[], projects: Project[], currentProjectName?: string): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanName = currentProjectName 
    ? currentProjectName.replace(/[^a-zA-Z0-9-_]/g, '_') 
    : 'All_Projects';
  const fileName = `TaskMonitor_${cleanName}_${dateStr}.xls`;

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  // Standard, clean plain table without fancy colors or background styles
  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Tasks</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #000000; }
        table { border-collapse: collapse; width: 100%; }
        th { font-weight: bold; border: 1px solid #000000; padding: 6px 8px; text-align: left; }
        td { border: 1px solid #000000; padding: 6px 8px; vertical-align: top; }
        .session-item { margin: 2px 0; }
      </style>
    </head>
    <body>
      <h3>Task Monitor - Work Sessions Schedule</h3>
      <p>Export Date: ${new Date().toLocaleDateString()}</p>
      <p>Project: ${currentProjectName ? escapeHtml(currentProjectName) : 'All Projects'}</p>
      <br/>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th style="width: 150px;">Project</th>
            <th style="width: 250px;">Task Title</th>
            <th style="width: 320px;">Work Sessions (Time Slots)</th>
            <th style="width: 110px;">Total Duration</th>
            <th style="width: 110px;">Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  tasks.forEach((task, idx) => {
    const projName = projectMap.get(task.projectId) || 'General';
    const slots = normalizeTaskTimeSlots(task);
    const status = getTaskOverallStatus(slots, task.completed);
    const totalDuration = calculateTotalDuration(slots);

    const statusLabel = 
      status === 'completed' ? 'Completed' :
      status === 'in-progress' ? 'In Progress' :
      status === 'overdue' ? 'Session Ended' : 'Scheduled';

    const sessionsHtml = slots.map((s, slotIdx) => {
      const start = formatTimeDisplay(s.startTime);
      const end = s.endTime ? formatTimeDisplay(s.endTime) : 'Pending';
      const slotDur = s.endTime ? ` (${calculateDuration(s.startTime, s.endTime)})` : '';
      const noteStr = s.note ? ` - Note: ${escapeHtml(s.note)}` : '';
      return `<div class="session-item">Session ${slotIdx + 1}: ${start} - ${end}${slotDur}${noteStr}</div>`;
    }).join('');

    tableHtml += `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(projName)}</td>
        <td>${escapeHtml(task.title)}</td>
        <td>${sessionsHtml}</td>
        <td>${totalDuration || '-'}</td>
        <td>${statusLabel}</td>
      </tr>
    `;
  });

  tableHtml += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
