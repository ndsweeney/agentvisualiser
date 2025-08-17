import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import type { DeployRequest, DeployResponse } from '../types';

@Injectable()
export class DeploymentService {
  private readonly logger = new Logger(DeploymentService.name);
  private readonly releasesPath = join(config.storage.path, 'releases');

  async deploy(request: DeployRequest): Promise<DeployResponse> {
    this.logger.log(`Starting deployment to ${request.environment}`);
    
    const releaseId = uuidv4();
    const timestamp = new Date().toISOString();
    
    try {
      // Ensure releases directory exists
      await fs.mkdir(this.releasesPath, { recursive: true });
      
      const releaseData = {
        id: releaseId,
        compiled: request.compiled,
        environment: request.environment,
        deployedAt: timestamp,
        status: 'deployed',
      };
      
      const filePath = join(this.releasesPath, `${releaseId}.json`);
      await fs.writeFile(filePath, JSON.stringify(releaseData, null, 2));
      
      this.logger.log(`Successfully deployed release ${releaseId} to ${request.environment}`);
      
      return {
        releaseId,
        environment: request.environment,
        deployedAt: timestamp,
      };
    } catch (error) {
      this.logger.error(`Deployment failed for release ${releaseId}`, error);
      throw error;
    }
  }

  async getRelease(releaseId: string): Promise<any> {
    try {
      const filePath = join(this.releasesPath, `${releaseId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Failed to get release ${releaseId}`, error);
      throw new Error(`Release ${releaseId} not found`);
    }
  }

  async getAllReleases(): Promise<any[]> {
    try {
      // Ensure releases directory exists
      await fs.mkdir(this.releasesPath, { recursive: true });
      
      const files = await fs.readdir(this.releasesPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const releases = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const filePath = join(this.releasesPath, file);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
          } catch (error) {
            this.logger.warn(`Failed to read release file ${file}`, error);
            return null;
          }
        })
      );
      
      // Filter out null values and sort by deployment date (newest first)
      return releases
        .filter(release => release !== null)
        .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
    } catch (error) {
      this.logger.error('Failed to get all releases', error);
      throw error;
    }
  }

  async deleteRelease(releaseId: string): Promise<void> {
    try {
      const filePath = join(this.releasesPath, `${releaseId}.json`);
      
      // Check if file exists first
      try {
        await fs.access(filePath);
      } catch (error) {
        this.logger.warn(`Release ${releaseId} not found for deletion`);
        throw new Error(`Release ${releaseId} not found`);
      }
      
      // Delete the release file
      await fs.unlink(filePath);
      
      this.logger.log(`Successfully deleted release ${releaseId}`);
    } catch (error) {
      this.logger.error(`Failed to delete release ${releaseId}`, error);
      throw error;
    }
  }
}