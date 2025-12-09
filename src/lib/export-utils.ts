import type { ProjectFeedback } from '@/hooks/useBuildProjects';

const categoryLabels: Record<string, string> = {
  bug: 'Bug',
  improvement: 'Mejora',
  design: 'Diseño',
  general: 'General',
};

const statusLabels: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  wont_fix: 'No se hará',
};

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export function exportFeedbackToCSV(feedback: ProjectFeedback[], projectTitle: string): void {
  const headers = ['ID', 'Categoría', 'Estado', 'Prioridad', 'Contenido', 'Autor', 'Fecha'];
  
  const rows = feedback.map((item) => [
    item.id,
    categoryLabels[item.category || 'general'] || item.category,
    statusLabels[item.status || 'open'] || item.status,
    priorityLabels[item.priority || 'medium'] || item.priority,
    `"${(item.content || '').replace(/"/g, '""')}"`,
    item.profiles?.full_name || 'Usuario',
    new Date(item.created_at).toLocaleDateString('es-ES'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `feedback-${projectTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportFeedbackToPDF(feedback: ProjectFeedback[], projectTitle: string): void {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug': return '#ef4444';
      case 'improvement': return '#eab308';
      case 'design': return '#a855f7';
      default: return '#3b82f6';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: '#ef4444',
      in_progress: '#eab308',
      resolved: '#22c55e',
      wont_fix: '#6b7280',
    };
    return `<span style="background-color: ${colors[status] || '#6b7280'}20; color: ${colors[status] || '#6b7280'}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${statusLabels[status] || status}</span>`;
  };

  const feedbackRows = feedback.map((item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${getCategoryColor(item.category || 'general')};"></div>
          <span style="font-weight: 500;">${categoryLabels[item.category || 'general']}</span>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${getStatusBadge(item.status || 'open')}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${priorityLabels[item.priority || 'medium']}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; max-width: 300px;">${item.content}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.profiles?.full_name || 'Usuario'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date(item.created_at).toLocaleDateString('es-ES')}</td>
    </tr>
  `).join('');

  const statsOpen = feedback.filter(f => f.status === 'open').length;
  const statsInProgress = feedback.filter(f => f.status === 'in_progress').length;
  const statsResolved = feedback.filter(f => f.status === 'resolved').length;
  const statsBugs = feedback.filter(f => f.category === 'bug').length;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Feedback - ${projectTitle}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .subtitle { color: #6b7280; margin-bottom: 24px; }
        .stats { display: flex; gap: 16px; margin-bottom: 32px; }
        .stat { background: #f3f4f6; padding: 16px 24px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: 700; }
        .stat-label { font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>Reporte de Feedback</h1>
      <p class="subtitle">${projectTitle} · Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${feedback.length}</div>
          <div class="stat-label">Total tickets</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #ef4444;">${statsOpen}</div>
          <div class="stat-label">Abiertos</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #eab308;">${statsInProgress}</div>
          <div class="stat-label">En progreso</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #22c55e;">${statsResolved}</div>
          <div class="stat-label">Resueltos</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #ef4444;">${statsBugs}</div>
          <div class="stat-label">Bugs</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Descripción</th>
            <th>Autor</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${feedbackRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
