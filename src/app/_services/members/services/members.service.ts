import { MembersRepository } from "./members.repository";
import { NotFoundError } from "@core/errors";
import type {
  UpdateMembershipInput,
  UpdateProfileInput,
  CompleteOnboardingInput,
  MemberProfileFilters,
} from "../types";
import { UpdateProfileSchema, CompleteOnboardingSchema } from "../types";

export class MembersService {
  constructor(private repository: MembersRepository) {}

  async getMembers() {
    return this.repository.findAll();
  }

  async getMemberByUserId(userId: string) {
    const member = await this.repository.findByUserId(userId);

    if (!member) {
      throw new NotFoundError("Member");
    }

    return member;
  }

  async getOrCreateMember(userId: string, membershipType: string = "basic") {
    let member = await this.repository.findByUserId(userId);

    if (!member) {
      member = await this.repository.create(userId, membershipType);
    }

    return member;
  }

  async updateMembership(userId: string, data: UpdateMembershipInput) {
    const member = await this.repository.findByUserId(userId);

    if (!member) {
      throw new NotFoundError("Member");
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

  // --- Profile methods ---

  async updateMemberProfile(userId: string, data: UpdateProfileInput) {
    const validated = UpdateProfileSchema.parse(data);
    const member = await this.repository.findByUserId(userId);
    if (!member) throw new NotFoundError("Member");

    return this.repository.updateProfile(userId, validated);
  }

  async completeOnboarding(userId: string, data: CompleteOnboardingInput) {
    const validated = CompleteOnboardingSchema.parse(data);
    const member = await this.repository.findByUserId(userId);
    if (!member) throw new NotFoundError("Member");

    const { termsAccepted, ...profileData } = validated;
    return this.repository.completeOnboarding(userId, {
      ...profileData,
      termsAccepted,
    } as any);
  }

  async getMemberWithProfile(userId: string) {
    const profile = await this.repository.findWithProfile(userId);
    if (!profile) throw new NotFoundError("Member");
    return profile;
  }

  async searchMembers(filters: MemberProfileFilters) {
    return this.repository.findByFilters(filters);
  }
}

export const membersService = new MembersService(new MembersRepository());
