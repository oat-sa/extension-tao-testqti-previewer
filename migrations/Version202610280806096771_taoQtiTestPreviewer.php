<?php

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\oatbox\reporting\Report;
use oat\tao\model\accessControl\func\AccessRule;
use oat\tao\model\accessControl\func\AclProxy;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\taoTests\models\user\TaoTestsRoles;

final class Version202610280806096771_taoQtiTestPreviewer extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Allow Test Authors to access assessment review information';
    }

    public function up(Schema $schema): void
    {
        AclProxy::applyRule($this->getRule());
        $this->addReport(Report::createSuccess('Granted Test Authors access to assessment review information'));
    }

    public function down(Schema $schema): void
    {
        AclProxy::revokeRule($this->getRule());
        $this->addReport(Report::createSuccess('Revoked Test Authors access to assessment review information'));
    }

    private function getRule(): AccessRule
    {
        return new AccessRule(
            AccessRule::GRANT,
            TaoTestsRoles::TEST_AUTHOR,
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'TestPreviewer', 'act' => 'assessmentInfo']
        );
    }
}
