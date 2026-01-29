import { format, isToday, isTomorrow, isYesterday, isPast, differenceInDays, isThisYear, parseISO, isValid, addDays, addWeeks, addMonths, addYears } from 'date-fns';

export default class Todo {
  constructor(title, description, dueDateString, priority = 'medium', recurrence = 'none', recurrenceEndDateString = null) {
    this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    this.title = title;
    this.description = description;
    this.dueDate = this._parseDate(dueDateString);
    this.priority = priority; // 'low', 'medium', 'high'
    this.completed = false;
    this.position = Date.now(); // For drag & drop ordering
    this.notes = '';
    this.checklist = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Recurrence properties
    this.recurrence = recurrence; // 'none', 'daily', 'weekly', 'monthly', 'yearly'
    this.recurrenceEndDate = this._parseDate(recurrenceEndDateString);
    this.skipDates = []; // Array of dates to skip
    this.nextOccurrence = this.dueDate; // Initial next occurrence is the due date
    
    // Calculate next occurrence if this is a recurring todo
    if (this.recurrence !== 'none' && this.dueDate) {
      this.calculateNextOccurrence();
    }
  }

  // Helper to parse any date format
  _parseDate(dateInput) {
    if (!dateInput) return null;
    
    // If it's already a valid Date object
    if (dateInput instanceof Date && isValid(dateInput)) {
      return dateInput;
    }
    
    // If it's a string
    if (typeof dateInput === "string") {
      // parseISO handles YYYY-MM-DD and ISO strings
      const parsed = parseISO(dateInput);
      if (isValid(parsed)) {
        return parsed;
      }
      
      // If parseISO fails, try as fallback (shouldn't happen with YYYY-MM-DD)
      const dateObj = new Date(dateInput);
      if (isValid(dateObj)) {
        return dateObj;
      }
    }
    
    // If it's an object with __type from Storage.js (should be revived already)
    if (dateInput && typeof dateInput === "object" && dateInput.__type === "Date") {
      try {
        const dateObj = new Date(dateInput.value);
        if (isValid(dateObj)) {
          return dateObj;
        }
      } catch (e) {
        // Ignore
      }
    }
    
    return null;
  }

  _getDateObject() {
    if (!this.dueDate) return null;
    
    if (this.dueDate instanceof Date && isValid(this.dueDate)) {
      return this.dueDate;
    }
    
    // If somehow we still have a string, parse it
    if (typeof this.dueDate === 'string') {
      return this._parseDate(this.dueDate);
    }
    
    return null;
  }

  getFormattedDate() {
    const dateObj = this._getDateObject();
    if (!dateObj) return 'No due date';

    if (isToday(dateObj)) {
      return 'Today';
    } else if (isTomorrow(dateObj)) {
      return 'Tomorrow';
    } else if (isYesterday(dateObj)) {
      return 'Yesterday';
    } else if (isPast(dateObj)) {
      const daysAgo = differenceInDays(new Date(), dateObj);
      return `${daysAgo} days ago`;
    } else {
      const daysUntil = differenceInDays(dateObj, new Date());
      return `In ${daysUntil} days`;
    }
  }

  getShortDate() {
    const dateObj = this._getDateObject();
    if (!dateObj) return '';
    
    if (isThisYear(dateObj)) {
      return format(dateObj, 'MMM d');
    } else {
      return format(dateObj, 'MMM d, yyyy');
    }
  }

  getFullDate() {
    const dateObj = this._getDateObject();
    if (!dateObj) return '';
    
    return format(dateObj, 'EEEE, MMMM d, yyyy');
  }

  getISODate() {
    const dateObj = this._getDateObject();
    if (!dateObj) return '';
    
    return dateObj.toISOString().split('T')[0];
  }

  isOverdue() {
    if (!this.dueDate) return false;
    const dateObj = this._getDateObject();
    if (!dateObj) return false;
    return !this.completed && dateObj < new Date();
  }

  toggleCompletion() {
    this.completed = !this.completed;
    this.updatedAt = new Date();
    
    // If this is a recurring todo and we're marking it complete,
    // advance to the next occurrence
    if (this.completed && this.recurrence !== 'none') {
      this.advanceRecurrence();
    }
  }

  getPriorityClass() {
    return `priority-${this.priority}`;
  }

  update({ title, description, dueDate, priority, recurrence, recurrenceEndDate }) {
    this.title = title || this.title;
    this.description = description || this.description;
    this.dueDate = dueDate ? this._parseDate(dueDate) : this.dueDate;
    this.priority = priority || this.priority;
    this.recurrence = recurrence !== undefined ? recurrence : this.recurrence;
    this.recurrenceEndDate = recurrenceEndDate ? this._parseDate(recurrenceEndDate) : this.recurrenceEndDate;
    this.updatedAt = new Date();
    
    // Recalculate next occurrence if recurrence changed
    if (this.recurrence !== 'none' && this.dueDate) {
      this.calculateNextOccurrence();
    }
  }

  // ===== RECURRENCE METHODS =====
  
  calculateNextOccurrence() {
    if (!this.dueDate || this.recurrence === 'none') {
      this.nextOccurrence = this.dueDate;
      return;
    }
    
    let nextDate = new Date(this.dueDate);
    const today = new Date();
    
    // Keep advancing until we find a date that's in the future
    // and not in skipDates
    while (nextDate <= today || this.isDateSkipped(nextDate)) {
      nextDate = this._addRecurrenceInterval(nextDate, 1);
      
      // Check if we've passed the recurrence end date
      if (this.recurrenceEndDate && nextDate > this.recurrenceEndDate) {
        this.nextOccurrence = null;
        this.recurrence = 'none'; // Stop recurring
        return;
      }
    }
    
    this.nextOccurrence = nextDate;
  }

  _addRecurrenceInterval(date, count = 1) {
    switch (this.recurrence) {
      case 'daily':
        return addDays(date, count);
      case 'weekly':
        return addWeeks(date, count);
      case 'monthly':
        return addMonths(date, count);
      case 'yearly':
        return addYears(date, count);
      default:
        return date;
    }
  }

  advanceRecurrence() {
    if (this.recurrence === 'none' || !this.dueDate) return;
    
    // Move dueDate to next occurrence
    this.dueDate = this.nextOccurrence;
    this.completed = false; // Reset completion for next occurrence
    this.updatedAt = new Date();
    
    // Calculate the next occurrence after this one
    this.calculateNextOccurrence();
  }

  skipThisOccurrence() {
    if (!this.nextOccurrence) return;
    
    // Add current next occurrence to skip dates
    const skipDateStr = this.nextOccurrence.toISOString().split('T')[0];
    if (!this.skipDates.includes(skipDateStr)) {
      this.skipDates.push(skipDateStr);
    }
    
    // Calculate new next occurrence
    this.calculateNextOccurrence();
    this.updatedAt = new Date();
  }

  isDateSkipped(date) {
    if (!date || this.skipDates.length === 0) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return this.skipDates.includes(dateStr);
  }

  isRecurring() {
    return this.recurrence !== 'none';
  }

  getRecurrenceText() {
    switch (this.recurrence) {
      case 'daily':
        return 'Repeats daily';
      case 'weekly':
        return 'Repeats weekly';
      case 'monthly':
        return 'Repeats monthly';
      case 'yearly':
        return 'Repeats yearly';
      default:
        return 'Does not repeat';
    }
  }

  getNextOccurrenceText() {
    if (!this.nextOccurrence) return 'No next occurrence';
    
    if (isToday(this.nextOccurrence)) {
      return 'Next: Today';
    } else if (isTomorrow(this.nextOccurrence)) {
      return 'Next: Tomorrow';
    } else {
      return `Next: ${format(this.nextOccurrence, 'MMM d, yyyy')}`;
    }
  }
}
