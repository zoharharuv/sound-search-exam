import type { SoundProvider } from "@/api/sound-provider";
import { mixcloudProvider } from "@/api/mixcloud/mixcloud-provider";

/** Composition-root provider selection; consumers depend only on the contract. */
export const soundProvider: SoundProvider = mixcloudProvider;
