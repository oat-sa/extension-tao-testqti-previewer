<?php

/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA.
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\tao\scripts\tools\accessControl\SetRolesAccess;

final class Version202204201509000545_taoQtiTestPreviewer extends AbstractMigration
{
    private const CONFIG = [
        SetRolesAccess::CONFIG_RULES => [
            'http://www.tao.lu/Ontologies/TAOItem.rdf#TestAuthor' => [
                [
                    'ext' => 'taoQtiTestPreviewer',
                    'mod' => 'TestPreviewer',
                    'act' => 'init'
                ],
                [
                    'ext' => 'taoQtiTestPreviewer',
                    'mod' => 'TestPreviewer',
                    'act' => 'configuration'
                ],
                [
                    'ext' => 'taoQtiTestPreviewer',
                    'mod' => 'Previewer',
                    'act' => 'getItem'
                ],
                [
                    'ext' => 'taoQtiTestPreviewer',
                    'mod' => 'Previewer',
                    'act' => 'asset'
                ],
            ],
        ],
    ];

    public function getDescription(): string
    {
        return 'Assign permissions to Test Author role';
    }

    public function up(Schema $schema): void
    {
        $this->runAction(
            new SetRolesAccess(),
            [
                '--' . SetRolesAccess::OPTION_CONFIG, self::CONFIG,
            ]
        );
    }

    public function down(Schema $schema): void
    {
        $this->runAction(
            new SetRolesAccess(),
            [
                '--' . SetRolesAccess::OPTION_REVOKE,
                '--' . SetRolesAccess::OPTION_CONFIG, self::CONFIG,
            ]
        );
    }
}