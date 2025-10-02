import { MembersRepository } from './members.repository';
import { NotFoundError } from '@core/errors';
import type { UpdateMembershipInput } from '../types';

export class MembersService {
  constructor(private repository: MembersRepository) {}

  async getMembers() {
    return this.repository.findAll();
  }

  async getMemberByUserId(userId: string) {
    const member = await this.repository.findByUserId(userId);
    
    if (!member) {
      throw new NotFoundError('Member');
    }
    
    return member;
  }

  async getOrCreateMember(userId: string, membershipType: string = 'basic') {
    let member = await this.repository.findByUserId(userId);
    
    if (!member) {
      member = await this.repository.create(userId, membershipType);
    }
    
    return member;
  }

  async updateMembership(userId: string, data: UpdateMembershipInput) {
    const member = await this.repository.findByUserId(userId);
    
    if (!member) {
      throw new NotFoundError('Member');
    }
    
    return this.repository.update(userId, data);
  }

  async addContributionPoints(userId: string, points: number) {
    await this.getOrCreateMember(userId);
    return this.repository.addContributionPoints(userId, points);
  }

  async getMemberStats() {
    return this.repository.getStats();
  }
}

export const membersService = new MembersService(new MembersRepository());
