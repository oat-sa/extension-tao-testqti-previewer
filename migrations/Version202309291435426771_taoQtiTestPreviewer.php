<?php

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\tao\scripts\SyncModels;
use oat\tao\scripts\tools\migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 *
 * phpcs:disable Squiz.Classes.ValidClassName
 */
final class Version202309291435426771_taoQtiTestPreviewer extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Update Ontology models';
    }

    public function up(Schema $schema): void
    {
        $this->addReport(
            $this->propagate(new SyncModels())([])
        );
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException(
            'The models should be updated via `SyncModels` script after reverting their RDF definitions.'
        );
    }
}
