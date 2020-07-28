<?php

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\tao\model\asset\AssetService;
use oat\tao\model\ClientLibRegistry;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202007281009426771_taoQtiTestPreviewer extends AbstractMigration
{

    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        $assetService = $this->getServiceManager()->get(AssetService::SERVICE_ID);
        $taoItemRunnerNpmDist = $assetService->getJsBaseWww('taoQtiTestPreviewer') . 'node_modules/@oat-sa-private/tao-item-runner-qtinui/dist/';
        $clientLibRegistry = ClientLibRegistry::getRegistry();
        $clientLibRegistry->register('taoItemRunnerQtiNUI', $taoItemRunnerNpmDist);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs

    }
}
