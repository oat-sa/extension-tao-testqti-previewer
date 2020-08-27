<?php

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\taoQtiTestPreviewer\scripts\install\RegisterTestPreviewer;
use oat\tao\model\ClientLibConfigRegistry;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202008261239036771_taoQtiTestPreviewer extends AbstractMigration
{

    public function getDescription(): string
    {
        return 'Register Test Previewer';
    }

    public function up(Schema $schema): void
    {
        $script = new RegisterTestPreviewer();
        $this->propagate($script);
        $script([]);
    }

    public function down(Schema $schema): void
    {
        ClientLibConfigRegistry::getRegistry()->remove(
            'taoTests/previewer/factory'
        );
    }
}
