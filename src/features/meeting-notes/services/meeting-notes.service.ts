import { MeetingNotesRepository } from './meeting-notes.repository';
import { NotFoundError, ForbiddenError } from '@core/errors';
import type { CreateMeetingNoteInput } from '../types';

export class MeetingNotesService {
  constructor(private repository: MeetingNotesRepository) {}

  async getMeetingNotes() {
    return this.repository.findAll();
  }

  async getMeetingNoteById(id: string) {
    const note = await this.repository.findById(id);
    
    if (!note) {
      throw new NotFoundError('Meeting note');
    }
    
    return note;
  }

  async searchMeetingNotes(searchTerm: string) {
    return this.repository.search(searchTerm);
  }

  async createMeetingNote(data: CreateMeetingNoteInput, userId: string) {
    return this.repository.create(data, userId);
  }

  async updateMeetingNote(id: string, data: Partial<CreateMeetingNoteInput>, userId: string) {
    const note = await this.repository.findById(id);
    
    if (!note) {
      throw new NotFoundError('Meeting note');
    }
    
    if (note.authorId !== userId) {
      throw new ForbiddenError('Only the author can update the meeting note');
    }
    
    return this.repository.update(id, data);
  }

  async deleteMeetingNote(id: string, userId: string) {
    const note = await this.repository.findById(id);
    
    if (!note) {
      throw new NotFoundError('Meeting note');
    }
    
    if (note.authorId !== userId) {
      throw new ForbiddenError('Only the author can delete the meeting note');
    }
    
    await this.repository.delete(id);
  }
}

export const meetingNotesService = new MeetingNotesService(new MeetingNotesRepository());
