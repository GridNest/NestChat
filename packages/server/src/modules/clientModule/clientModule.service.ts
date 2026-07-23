import { UpdateClientModulesRequest } from '@nestchat/shared';
import { ClientModuleModel, ClientModuleDocument } from './clientModule.model.js';
import { ApiError } from '../../utils/apiError.js';

export interface ClientModuleResponse {
  id: string;
  clientId: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export class ClientModuleService {
  static async getByClientId(clientId: string): Promise<ClientModuleResponse[]> {
    const modules = await ClientModuleModel.find({ clientId });
    if (modules.length === 0) {
      return this.createDefaults(clientId);
    }
    return modules.map(this.formatModule);
  }

  static async createDefaults(clientId: string): Promise<ClientModuleResponse[]> {
    const defaultModules = [
      { name: 'FAQ', enabled: true },
      { name: 'Knowledge', enabled: true },
      { name: 'Inquiry', enabled: true },
      { name: 'Gallery', enabled: false },
      { name: 'Menu', enabled: false },
      { name: 'Rooms', enabled: false },
      { name: 'Products', enabled: false },
      { name: 'Services', enabled: false },
      { name: 'Portfolio', enabled: false },
      { name: 'Blog', enabled: false },
      { name: 'Events', enabled: false },
      { name: 'Booking', enabled: false },
      { name: 'Contact', enabled: true },
    ];

    const modules = await Promise.all(
      defaultModules.map(async (mod) => {
        return ClientModuleModel.create({
          clientId,
          name: mod.name,
          enabled: mod.enabled,
          config: {},
        });
      })
    );

    return modules.map(this.formatModule);
  }

  static async update(clientId: string, data: UpdateClientModulesRequest): Promise<ClientModuleResponse[]> {
    const results: ClientModuleResponse[] = [];

    for (const moduleData of data.modules) {
      let module = await ClientModuleModel.findOne({ clientId, name: moduleData.name });
      
      if (!module) {
        module = await ClientModuleModel.create({
          clientId,
          name: moduleData.name,
          enabled: moduleData.enabled,
          config: moduleData.config || {},
        });
      } else {
        module = await ClientModuleModel.findByIdAndUpdate(
          module._id,
          {
            enabled: moduleData.enabled,
            config: moduleData.config || module.config,
          },
          { new: true }
        );
      }

      results.push(this.formatModule(module!));
    }

    return results;
  }

  static async toggleModule(clientId: string, moduleName: string, enabled: boolean): Promise<ClientModuleResponse> {
    let module = await ClientModuleModel.findOne({ clientId, name: moduleName });
    
    if (!module) {
      module = await ClientModuleModel.create({
        clientId,
        name: moduleName as any,
        enabled,
        config: {},
      });
    } else {
      module = await ClientModuleModel.findByIdAndUpdate(
        module._id,
        { enabled },
        { new: true }
      );
    }

    return this.formatModule(module!);
  }

  static async delete(clientId: string, moduleName: string): Promise<void> {
    const module = await ClientModuleModel.findOneAndDelete({ clientId, name: moduleName });
    if (!module) {
      throw new ApiError(404, 'Client module not found');
    }
  }

  private static formatModule(module: ClientModuleDocument): ClientModuleResponse {
    return {
      id: module._id.toString(),
      clientId: module.clientId.toString(),
      name: module.name,
      enabled: module.enabled,
      config: module.config,
    };
  }
}
