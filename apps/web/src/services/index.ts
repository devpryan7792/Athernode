import {
  serverService as mockServerService,
  telemetryService as mockTelemetryService,
  addonService as mockAddonService,
  playerService as mockPlayerService,
  fileService as mockFileService,
  velocityService as mockVelocityService,
  schematicService as mockSchematicService,
} from './mock';
import type {
  IServerService,
  ITelemetryService,
  IAddonService,
  IPlayerService,
  IFileService,
  IVelocityService,
  ISchematicService,
} from './contracts';

// In standalone mode (or default dev), use the high-fidelity mock engine
const isMock = import.meta.env.VITE_USE_MOCKS !== 'false';

export const serverService: IServerService = isMock ? mockServerService : mockServerService;
export const telemetryService: ITelemetryService = isMock ? mockTelemetryService : mockTelemetryService;
export const addonService: IAddonService = isMock ? mockAddonService : mockAddonService;
export const playerService: IPlayerService = isMock ? mockPlayerService : mockPlayerService;
export const fileService: IFileService = isMock ? mockFileService : mockFileService;
export const velocityService: IVelocityService = isMock ? mockVelocityService : mockVelocityService;
export const schematicService: ISchematicService = isMock ? mockSchematicService : mockSchematicService;

export * from './contracts';
