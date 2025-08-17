import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../config';
import type { Tool } from '../types';

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);
  private readonly toolsPath = join(config.storage.path, 'tools.json');

  async getTools(): Promise<Tool[]> {
    try {
      const data = await fs.readFile(this.toolsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return empty array if file doesn't exist
      return [];
    }
  }

  async createTool(tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tool> {
    const tools = await this.getTools();
    const timestamp = new Date().toISOString();
    
    const newTool: Tool = {
      ...tool,
      id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    tools.push(newTool);
    await this.saveTools(tools);
    
    this.logger.log(`Created tool: ${newTool.id}`);
    return newTool;
  }

  private async saveTools(tools: Tool[]): Promise<void> {
    // Ensure storage directory exists
    await fs.mkdir(config.storage.path, { recursive: true });
    await fs.writeFile(this.toolsPath, JSON.stringify(tools, null, 2));
  }
}