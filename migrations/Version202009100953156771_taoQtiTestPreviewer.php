<?php

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\tao\model\accessControl\func\AccessRule;
use oat\tao\model\accessControl\func\AclProxy;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\taoItems\model\ontology\ItemAuthorRole;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202009100953156771_taoQtiTestPreviewer extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Grant access to previewer to item author';
    }

    public function up(Schema $schema): void
    {
        AclProxy::applyRule(
            new AccessRule(
                AccessRule::GRANT,
                ItemAuthorRole::INSTANCE_URI,
                ['ext' => 'taoQtiTestPreviewer', 'mod' => 'Previewer']
            )
        );
    }

    public function down(Schema $schema): void
    {
        AclProxy::revokeRule(
            new AccessRule(
                AccessRule::GRANT,
                ItemAuthorRole::INSTANCE_URI,
                ['ext' => 'taoQtiTestPreviewer', 'mod' => 'Previewer']
            )
        );
    }
}
