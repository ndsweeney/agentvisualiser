import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import type { CompiledService } from '@agentfactory/types';

interface StoredCompiledProject {
  id: string;
  blueprintId: string;
  blueprintName: string;
  compiled: CompiledService;
  compiledAt: string;
}

@Injectable()
export class CompiledProjectsService {
  private readonly logger = new Logger(CompiledProjectsService.name);
  private readonly compiledPath = join(config.storage.path, 'compiled');

  async storeCompiledProject(data: { blueprintId: string; blueprintName: string; compiled: CompiledService }): Promise<StoredCompiledProject> {
    this.logger.log(`Storing compiled project: ${data.blueprintName}`);
    
    const compiledId = uuidv4();
    const timestamp = new Date().toISOString();
    
    try {
      // Ensure compiled directory exists
      await fs.mkdir(this.compiledPath, { recursive: true });
      
      const compiledProject: StoredCompiledProject = {
        id: compiledId,
        blueprintId: data.blueprintId,
        blueprintName: data.blueprintName,
        compiled: data.compiled,
        compiledAt: timestamp,
      };
      
      const filePath = join(this.compiledPath, `${compiledId}.json`);
      await fs.writeFile(filePath, JSON.stringify(compiledProject, null, 2));
      
      this.logger.log(`Successfully stored compiled project ${compiledId}`);
      return compiledProject;
    } catch (error) {
      this.logger.error(`Failed to store compiled project ${compiledId}`, error);
      throw error;
    }
  }

  async getAllCompiledProjects(): Promise<StoredCompiledProject[]> {
    try {
      // Ensure compiled directory exists
      await fs.mkdir(this.compiledPath, { recursive: true });
      
      const files = await fs.readdir(this.compiledPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const compiledProjects = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const filePath = join(this.compiledPath, file);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data) as StoredCompiledProject;
          } catch (error) {
            this.logger.warn(`Failed to read compiled project file ${file}`, error);
            return null;
          }
        })
      );
      
      // Filter out null values and sort by compilation date (newest first)
      return compiledProjects
        .filter(project => project !== null)
        .sort((a, b) => new Date(b.compiledAt).getTime() - new Date(a.compiledAt).getTime());
    } catch (error) {
      this.logger.error('Failed to get compiled projects', error);
      return [];
    }
  }

  async deleteCompiledProject(compiledId: string): Promise<void> {
    try {
      const filePath = join(this.compiledPath, `${compiledId}.json`);
      
      // Check if file exists first
      try {
        await fs.access(filePath);
      } catch (error) {
        this.logger.warn(`Compiled project ${compiledId} not found for deletion`);
        throw new Error(`Compiled project ${compiledId} not found`);
      }
      
      // Delete the compiled project file
      await fs.unlink(filePath);
      
      this.logger.log(`Successfully deleted compiled project ${compiledId}`);
    } catch (error) {
      this.logger.error(`Failed to delete compiled project ${compiledId}`, error);
      throw error;
    }
  }
}