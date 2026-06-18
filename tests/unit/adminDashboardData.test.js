const { getPeriodRange } = require('../../utils/adminDashboardData');

describe('adminDashboardData', () => {
  test('getPeriodRange returns daily range by default', () => {
    const { start, end, period, label } = getPeriodRange('daily');
    expect(period).toBe('daily');
    expect(label).toContain('Today');
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(end.getTime()).toBeGreaterThanOrEqual(start.getTime());
  });

  test('getPeriodRange supports weekly/monthly/annual', () => {
    expect(getPeriodRange('weekly').label).toContain('Week');
    expect(getPeriodRange('monthly').label).toContain('Month');
    expect(getPeriodRange('annual').label).toContain('Year');
  });
});
