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
 * Copyright (c) 2018-2022 (original work) Open Assessment Technologies SA.
 */

use oat\taoItems\model\user\TaoItemsRoles;
use oat\tao\model\accessControl\func\AccessRule;
use oat\taoQtiTestPreviewer\models\ServiceProvider\QtiTestPreviewerServiceProvider;
use oat\taoQtiTestPreviewer\scripts\update\Updater;
use oat\taoQtiTestPreviewer\scripts\install\RegisterPreviewers;
use oat\taoQtiTestPreviewer\scripts\install\RegisterTestPreviewer;

return [
    'name' => 'taoQtiTestPreviewer',
    'label' => 'extension-tao-testqti-previewer',
    'description' => 'extension that provides QTI test previewer',
    'license'     => 'GPL-2.0',
    'author' => 'Open Assessment Technologies SA',
    'managementRole' => 'http://www.tao.lu/Ontologies/TAOTest.rdf#TaoQtiTestPreviewerRole',
    'acl' => [
        [
            AccessRule::GRANT,
            'http://www.tao.lu/Ontologies/TAOTest.rdf#TaoQtiTestPreviewerRole',
            ['ext' => 'taoQtiTestPreviewer'],
        ],
        [
            AccessRule::GRANT,
            'http://www.tao.lu/Ontologies/TAOItem.rdf#TestAuthor',
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'TestPreviewer', 'act' => 'init'],
        ],
        [
            AccessRule::GRANT,
            'http://www.tao.lu/Ontologies/TAOItem.rdf#TestAuthor',
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'TestPreviewer', 'act' => 'configuration'],
        ],
        [
            AccessRule::GRANT,
            'http://www.tao.lu/Ontologies/TAOItem.rdf#TestAuthor',
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'Previewer', 'act' => 'getItem'],
        ],
        [
            AccessRule::GRANT,
            'http://www.tao.lu/Ontologies/TAOItem.rdf#TestAuthor',
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'Previewer', 'act' => 'asset'],
        ],
        [
            AccessRule::GRANT,
            TaoItemsRoles::ITEM_AUTHOR,
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'Previewer'],
        ],
        [
            AccessRule::GRANT,
            TaoItemsRoles::ITEM_PREVIEWER,
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'Previewer', 'act' => 'init'],
        ],
        [
            AccessRule::GRANT,
            TaoItemsRoles::ITEM_PREVIEWER,
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'Previewer', 'act' => 'getItem'],
        ],
        [
            AccessRule::GRANT,
            TaoItemsRoles::ITEM_PREVIEWER,
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'Previewer', 'act' => 'submitItem'],
        ],
        [
            AccessRule::GRANT,
            TaoItemsRoles::ITEM_PREVIEWER,
            ['ext' => 'taoQtiTestPreviewer', 'mod' => 'Previewer', 'act' => 'asset'],
        ],
    ],
    'install' => [
        'php' => [
            RegisterPreviewers::class,
            RegisterTestPreviewer::class
        ],
        'rdf' => [
            __DIR__ . '/install/ontology/previewerRole.rdf',
        ],
    ],
    'update' => Updater::class,
    'uninstall' => [
    ],
    'routes' => [
        '/taoQtiTestPreviewer' => 'oat\\taoQtiTestPreviewer\\controller'
    ],
    'constants' => [
        # views directory
        'DIR_VIEWS' => __DIR__ . DIRECTORY_SEPARATOR . 'views' . DIRECTORY_SEPARATOR,

        #BASE URL (usually the domain root)
        'BASE_URL'  => ROOT_URL . 'taoQtiTestPreviewer/',
    ],
    'extra' => [
        'structures' => __DIR__ . DIRECTORY_SEPARATOR . DIRECTORY_SEPARATOR . 'structures.xml',
    ],
    'containerServiceProviders' => [
        QtiTestPreviewerServiceProvider::class,
    ],
];
