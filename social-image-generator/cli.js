#!/usr/bin/env node

/**
 * Social Image Generator CLI
 *
 * Generate professional, on-brand social media images
 */

const { program } = require('commander');
const path = require('path');

// Check Node.js version
const MIN_NODE_VERSION = 18;
const currentVersion = parseInt(process.version.match(/v(\d+)/)[1]);

if (currentVersion < MIN_NODE_VERSION) {
  console.error(`❌ Node.js ${MIN_NODE_VERSION}+ required. Current version: ${process.version}`);
  console.error(`   Please upgrade: https://nodejs.org/`);
  process.exit(1);
}

// Core modules
const generator = require('./lib/generator');
const brandLoader = require('./lib/brand-loader');
const validator = require('./lib/validator');
const templateEngine = require('./lib/template-engine');
const governor = require('./lib/resource-governor');
const rateLimiter = require('./lib/rate-limiter');

program
  .name('social-image-generator')
  .description('Generate professional, on-brand social media images')
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .description('Generate a single social media image')
  .requiredOption('-c, --client <name>', 'Client ID (e.g., brave-life)')
  .requiredOption('-t, --template <name>', 'Template name (e.g., quote-gradient)')
  .requiredOption('--content <text>', 'Main content text')
  .option('-p, --platform <platform>', 'Platform and format (e.g., instagram-feed)', 'instagram-feed')
  .option('--reference <text>', 'Reference text (e.g., Bible verse)')
  .option('--logo-placement <position>', 'Logo placement override')
  .option('--gradient <name>', 'Gradient override (from brand config)')
  .option('--output <path>', 'Custom output directory')
  .action(async (options) => {
    try {
      console.log('🎨 Starting image generation...\n');

      const result = await generator.generateSingle({
        clientId: options.client,
        template: options.template,
        platform: options.platform,
        content: {
          main: options.content,
          reference: options.reference
        },
        overrides: {
          logoPlacement: options.logoPlacement,
          gradient: options.gradient
        },
        outputDir: options.output
      });

      console.log('\n✅ Image generated successfully!');
      console.log(`📁 Location: ${result.path}`);
      console.log(`📐 Dimensions: ${result.width}x${result.height}`);
      console.log(`📦 File size: ${result.fileSize}`);
      console.log(`\n💡 Open with: open "${result.path}"`);

    } catch (error) {
      console.error(`\n❌ Generation failed: ${error.message}`);

      if (error.message.includes('not found')) {
        console.error(`\n💡 Tip: Check available clients with: node cli.js list-clients`);
      }

      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate a brand configuration file')
  .requiredOption('-c, --client <name>', 'Client ID to validate')
  .action(async (options) => {
    try {
      console.log(`🔍 Validating brand config for ${options.client}...\n`);

      const brand = await brandLoader.load(options.client, { validate: false });
      const validation = await validator.validateBrandConfig(brand);

      if (validation.valid) {
        console.log('✅ Brand configuration is valid!\n');
        console.log(`📊 Summary:`);
        console.log(`   - Colors: ${validation.stats.colors} defined`);
        console.log(`   - Gradients: ${validation.stats.gradients} available`);
        console.log(`   - Templates: ${validation.stats.templates} enabled`);
        console.log(`   - Platforms: ${validation.stats.platforms} configured`);

        if (validation.contrastResults && validation.contrastResults.length > 0) {
          console.log(`\n🎨 Contrast Validation:`);
          validation.contrastResults.forEach(result => {
            const icon = result.meetsAAA ? '✅' : result.meetsAA ? '⚠️' : '❌';
            console.log(`   ${icon} ${result.pair}: ${result.ratio}:1 (${result.grade})`);
          });
        }

        if (validation.warnings.length > 0) {
          console.log(`\n⚠️  Warnings:`);
          validation.warnings.forEach(w => {
            console.log(`   • ${w.message}`);
          });
        }

      } else {
        console.log('❌ Brand configuration has errors:\n');
        validation.errors.forEach(err => {
          console.log(`   • ${err.field}: ${err.message}`);
        });
        process.exit(1);
      }

    } catch (error) {
      console.error(`❌ Validation failed: ${error.message}`);
      process.exit(1);
    }
  });

// List clients command
program
  .command('list-clients')
  .description('List all available clients')
  .action(async () => {
    try {
      const clients = await brandLoader.listClients();

      if (clients.length === 0) {
        console.log('No clients found in brands/ directory');
        return;
      }

      console.log(`📋 Available Clients (${clients.length}):\n`);
      clients.forEach(client => {
        console.log(`   • ${client}`);
      });

    } catch (error) {
      console.error(`❌ Failed to list clients: ${error.message}`);
      process.exit(1);
    }
  });

// List templates command
program
  .command('list-templates')
  .description('List all available templates')
  .option('-c, --client <name>', 'Filter by client (shows enabled templates)')
  .action(async (options) => {
    try {
      const templates = await templateEngine.listTemplates();

      if (templates.length === 0) {
        console.log('No templates found in templates/ directory');
        return;
      }

      console.log(`📋 Available Templates (${templates.length}):\n`);
      templates.forEach(t => {
        console.log(`   ${t.id}`);
        console.log(`   ${t.description}`);
        console.log(`   Platforms: ${t.platforms.join(', ')}`);
        console.log('');
      });

    } catch (error) {
      console.error(`❌ Failed to list templates: ${error.message}`);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show resource usage statistics')
  .action(() => {
    console.log('📊 Resource Statistics:\n');

    const govStats = governor.getStats();
    const govUsage = governor.getUsage();
    const rateStats = rateLimiter.getStats();

    console.log('Resource Governor:');
    console.log(`   Operations: ${govStats.totalOperations} total, ${govStats.successfulOperations} successful`);
    console.log(`   Success rate: ${govStats.successRate}%`);
    console.log(`   Concurrent: ${govUsage.concurrent}/${govUsage.maxConcurrent}`);
    console.log(`   Memory: ${govUsage.memoryPercent}% used`);
    console.log(`   Disk: ${govUsage.diskPercent}% used`);

    console.log('\nRate Limiter:');
    console.log(`   Total requests: ${rateStats.totalRequests}`);
    console.log(`   Blocked: ${rateStats.blockedRequests} (${rateStats.blockRate}%)`);
    console.log(`   Active clients: ${rateStats.activeClients}`);
  });

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  await governor.shutdown(5000);
  rateLimiter.shutdown();
  process.exit(0);
});

program.parse();
