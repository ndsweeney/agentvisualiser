#!/usr/bin/env node

import { Command } from 'commander';
import { promises as fs } from 'fs';
import { createClient } from './client';
import type { ProjectSpec } from '@agentfactory/types';

interface Config {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

const program = new Command();

program
  .name('af')
  .description('AgentFactory CLI - Build and deploy multi-agent systems')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new AgentFactory project')
  .action(async () => {
    const config = {
      baseUrl: 'http://localhost:3001',
      timeout: 30000,
    };

    try {
      await fs.writeFile(
        'agentfactory.config.json',
        JSON.stringify(config, null, 2)
      );
      console.log('✅ Created agentfactory.config.json');
    } catch (error) {
      console.error('❌ Failed to create config file:', error);
      process.exit(1);
    }
  });

program
  .command('blueprint')
  .description('Generate a blueprint ProjectSpec')
  .argument('<name>', 'Blueprint name (multi-agent, approval-chain, data-pipeline, helpdesk-automation, maker-checker)')
  .action(async (name: string) => {
    try {
      const config = await loadConfig();
      const client = createClient(config);
      
      const spec = await client.materializeBlueprint(name);
      console.log(JSON.stringify(spec, null, 2));
    } catch (error) {
      console.error('❌ Failed to generate blueprint:', error);
      process.exit(1);
    }
  });

program
  .command('compile')
  .description('Compile a project specification')
  .option('-f, --file <file>', 'Project spec file path')
  .action(async (options) => {
    try {
      if (!options.file) {
        console.error('❌ Please specify a file with -f option');
        process.exit(1);
      }

      const specData = await fs.readFile(options.file, 'utf-8');
      const spec: ProjectSpec = JSON.parse(specData);

      const config = await loadConfig();
      const client = createClient(config);
      
      const result = await client.compile(spec);
      console.log(JSON.stringify(result.compiled, null, 2));

      if (result.warnings && result.warnings.length > 0) {
        console.error('\n⚠️ Warnings:');
        result.warnings.forEach(warning => console.error(`  - ${warning}`));
      }
    } catch (error) {
      console.error('❌ Compilation failed:', error);
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('Deploy a compiled project')
  .option('-f, --file <file>', 'Compiled project file path')
  .option('-e, --env <environment>', 'Target environment (dev, staging, prod)', 'dev')
  .action(async (options) => {
    try {
      if (!options.file) {
        console.error('❌ Please specify a file with -f option');
        process.exit(1);
      }

      const compiledData = await fs.readFile(options.file, 'utf-8');
      const compiled = JSON.parse(compiledData);

      const config = await loadConfig();
      const client = createClient(config);
      
      const result = await client.deploy(compiled, options.env);
      
      console.log('✅ Deployment successful!');
      console.log(`📦 Release ID: ${result.releaseId}`);
      console.log(`🌍 Environment: ${result.environment}`);
      console.log(`⏰ Deployed at: ${result.deployedAt}`);
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  });

program
  .command('eval')
  .description('Run evaluation on a deployed release')
  .option('-r, --release <releaseId>', 'Release ID to evaluate')
  .action(async (options) => {
    try {
      if (!options.release) {
        console.error('❌ Please specify a release ID with -r option');
        process.exit(1);
      }

      const config = await loadConfig();
      const client = createClient(config);
      
      const run = await client.runEvaluation(options.release);
      
      console.log('✅ Evaluation started!');
      console.log(`🔍 Run ID: ${run.id}`);
      console.log(`📊 Status: ${run.status}`);
      console.log(`⏰ Started at: ${run.startedAt}`);
      
      // Poll for completion
      console.log('⏳ Waiting for evaluation to complete...');
      await pollEvaluation(client, run.id);
    } catch (error) {
      console.error('❌ Evaluation failed:', error);
      process.exit(1);
    }
  });

program
  .command('runs')
  .description('Get evaluation run metrics')
  .option('-r, --release <releaseId>', 'Release ID')
  .argument('[runId]', 'Specific run ID to get metrics for')
  .action(async (runId: string | undefined, options) => {
    try {
      const config = await loadConfig();
      const client = createClient(config);
      
      if (runId) {
        const run = await client.getEvalMetrics(runId);
        console.log('📊 Evaluation Run Metrics:');
        console.log(`🔍 Run ID: ${run.id}`);
        console.log(`📦 Release ID: ${run.releaseId}`);
        console.log(`📊 Status: ${run.status}`);
        console.log(`⏰ Started: ${run.startedAt}`);
        
        if (run.completedAt) {
          console.log(`✅ Completed: ${run.completedAt}`);
        }
        
        if (run.metrics) {
          console.log('\n📈 Metrics:');
          Object.entries(run.metrics).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        }
      } else {
        console.log('❌ Please specify a run ID');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to get run metrics:', error);
      process.exit(1);
    }
  });

async function loadConfig(): Promise<Config> {
  try {
    const configData = await fs.readFile('agentfactory.config.json', 'utf-8');
    return JSON.parse(configData);
  } catch {
    // Return default config if file doesn't exist
    return {
      baseUrl: 'http://localhost:3001',
      timeout: 30000,
    };
  }
}

async function pollEvaluation(client: any, runId: string, maxAttempts = 30): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const run = await client.getEvalMetrics(runId);
      
      if (run.status === 'completed') {
        console.log('✅ Evaluation completed!');
        console.log(`⏰ Completed at: ${run.completedAt}`);
        
        if (run.metrics) {
          console.log('\n📈 Results:');
          Object.entries(run.metrics).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        }
        return;
      } else if (run.status === 'failed') {
        console.log('❌ Evaluation failed');
        return;
      }
      
      console.log(`⏳ Still running... (${attempt + 1}/${maxAttempts})`);
    } catch (error) {
      console.error('❌ Error checking evaluation status:', error);
      return;
    }
  }
  
  console.log('⏰ Evaluation polling timeout');
}

program.parse();