import { PackMeta, ImageUsage } from './types';

export class PackMetaReader {
  private readonly meta: PackMeta;

  public readonly fallbackUsage: ImageUsage[] = [ImageUsage.Emoticon, ImageUsage.Sticker];

  constructor(meta: PackMeta) {
    this.meta = meta;
  }

  get name(): string | undefined {
    const displayName = this.meta.display_name;
    if (typeof displayName === 'string') return displayName;
    return undefined;
  }

  get avatar(): string | undefined {
    const avatarURL = this.meta.avatar_url;
    if (typeof avatarURL === 'string') return avatarURL;
    return undefined;
  }

  get attribution(): string | undefined {
    const { attribution } = this.meta;
    if (typeof this.meta.attribution === 'string') return attribution;
    return undefined;
  }

  get usage(): ImageUsage[] {
    if (!Array.isArray(this.meta.usage)) return this.fallbackUsage;

    const knownUsage = this.meta.usage.filter(
      (u) => u === ImageUsage.Emoticon || u === ImageUsage.Sticker
    );

    if (knownUsage.length === 0) return this.fallbackUsage;

    return knownUsage;
  }

  get content(): PackMeta {
    return this.meta;
  }
}
