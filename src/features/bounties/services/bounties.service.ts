import { BountiesRepository } from './bounties.repository';
import { NotFoundError, ForbiddenError } from '@core/errors';
import type { CreateBountyInput, BountyFilters } from '../types';

export class BountiesService {
  constructor(private repository: BountiesRepository) {}

  async getBounties(filters?: BountyFilters) {
    return this.repository.findAll(filters);
  }

  async getBountyById(id: string) {
    const bounty = await this.repository.findById(id);
    
    if (!bounty) {
      throw new NotFoundError('Bounty');
    }
    
    await this.repository.incrementViewCount(id);
    
    return bounty;
  }

  async createBounty(data: CreateBountyInput, userId: string) {
    return this.repository.create(data, userId);
  }

  async updateBounty(id: string, data: Partial<CreateBountyInput>, userId: string) {
    const bounty = await this.repository.findById(id);
    
    if (!bounty) {
      throw new NotFoundError('Bounty');
    }
    
    if (bounty.submitterId !== userId) {
      throw new ForbiddenError('Only the bounty submitter can update the bounty');
    }
    
    return this.repository.update(id, data);
  }

  async deleteBounty(id: string, userId: string) {
    const bounty = await this.repository.findById(id);
    
    if (!bounty) {
      throw new NotFoundError('Bounty');
    }
    
    if (bounty.submitterId !== userId) {
      throw new ForbiddenError('Only the bounty submitter can delete the bounty');
    }
    
    await this.repository.delete(id);
  }

  async screenBounty(id: string, screenerId: string, status: string, notes?: string) {
    const bounty = await this.repository.findById(id);
    
    if (!bounty) {
      throw new NotFoundError('Bounty');
    }
    
    return this.repository.updateStatus(id, status, screenerId, notes);
  }

  async publishBounty(id: string, userId: string) {
    const bounty = await this.repository.findById(id);
    
    if (!bounty) {
      throw new NotFoundError('Bounty');
    }
    
    if (bounty.submitterId !== userId && bounty.status !== 'screening') {
      throw new ForbiddenError('Bounty must be screened before publishing');
    }
    
    return this.repository.updateStatus(id, 'published');
  }
}

export const bountiesService = new BountiesService(new BountiesRepository());
