<?php

declare(strict_types=1);

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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

namespace oat\taoQtiTestPreviewer\controller;

use common_exception_UserReadableException;
use InvalidArgumentException;
use oat\tao\model\http\HttpJsonResponseTrait;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewer as TestPreviewerService;
use oat\taoQtiTestPreviewer\models\test\TestPreviewRequest;
use tao_actions_ServiceModule;
use taoQtiTest_helpers_TestRunnerUtils;
use Throwable;

class TestPreviewer extends tao_actions_ServiceModule
{
    use HttpJsonResponseTrait;

    /**
     * @security("hide")
     */
    public function __construct()
    {
        taoQtiTest_helpers_TestRunnerUtils::noHttpClientCache();
    }

    public function init()
    {
        $requestParams = $this->getPsrRequest()->getQueryParams();
        $testUri = $requestParams['testUri'] ?? null;

        try {
            if (null === $testUri) {
                throw  new InvalidArgumentException('Required `testUri` param is missing ');
            }

            /** @var TestPreviewerService $previewer */
            $previewer = $this->getServiceLocator()->get(TestPreviewerService::class);

            $response = $previewer->createPreview(new TestPreviewRequest($testUri));

            $this->setSuccessJsonResponse(
                [
                    'success' => true,
                    'testData' => $response->getTestData(),
                    'testContext' => $response->getTestContext(),
                    'testMap' => $response->getTestMap(),
                ]
            );
        } catch (Throwable $exception) {
            $message = ($exception instanceof common_exception_UserReadableException) ? $exception->getUserMessage(
            ) : $exception->getMessage();
            $this->setErrorJsonResponse($message);
        }
    }
}
