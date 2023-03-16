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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\controller;

use common_exception_UserReadableException;
use InvalidArgumentException;
use oat\tao\model\http\HttpJsonResponseTrait;
use oat\taoQtiTestPreviewer\models\test\TestPreviewConfig;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewer as TestPreviewerService;
use oat\taoQtiTestPreviewer\models\test\TestPreviewRequest;
use oat\taoQtiTestPreviewer\models\TestCategoryPresetMap;
use oat\taoQtiTestPreviewer\models\testConfiguration\service\TestPreviewerConfigurationService;
use qtism\data\storage\xml\XmlStorageException;
use tao_actions_ServiceModule;
use Throwable;

class TestPreviewer extends tao_actions_ServiceModule
{
    use HttpJsonResponseTrait;

    public function init()
    {
        try {
            $requestParams = $this->getPsrRequest()->getQueryParams();

            if (empty($requestParams['testUri'])) {
                throw  new InvalidArgumentException('Required `testUri` param is missing ');
            }

            $testPreviewRequest = new TestPreviewRequest(
                $requestParams['testUri'],
                new TestPreviewConfig([TestPreviewConfig::CHECK_INFORMATIONAL => true])
            );
            $response = $this->getTestPreviewerService()->createPreview($testPreviewRequest);

            $this->setNoCacheHeaders();

            $this->setSuccessJsonResponse(
                [
                    'success' => true,
                    'testData' => [],
                    'testContext' => [],
                    'testMap' => $response->getMap()->getMap(),
                    'presetMap' => $this->getTestPreviewerPresetsMapService()->getMap()
                ]
            );
        } catch (XmlStorageException $xmlStorageException) {
            $message = $this->mapXmlExceptionMessage($xmlStorageException);
            $this->setErrorJsonResponse($message);
        } catch (Throwable $exception) {
            $message = $exception instanceof common_exception_UserReadableException
                ? $exception->getUserMessage()
                : $exception->getMessage();

            $this->setErrorJsonResponse($message);
        }
    }

    public function configuration(): void
    {
        try {
            $this->setNoCacheHeaders();

            $this->setSuccessJsonResponse(
                $this->getTestPreviewerConfigurationService()->getConfiguration()
            );
        } catch (Throwable $exception) {
            $message = $exception instanceof common_exception_UserReadableException
                ? $exception->getUserMessage()
                : $exception->getMessage();

            $this->setErrorJsonResponse($message);
        }
    }

    private function setNoCacheHeaders(): void
    {
        $this->getResponseFormatter()
            ->addHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->addHeader('Pragma', 'no-cache')
            ->addHeader('Expires', '0');
    }

    private function getTestPreviewerConfigurationService(): TestPreviewerConfigurationService
    {
        return $this->getServiceLocator()->get(TestPreviewerConfigurationService::class);
    }

    private function getTestPreviewerService(): TestPreviewerService
    {
        return $this->getServiceLocator()->get(TestPreviewerService::class);
    }

    private function getTestPreviewerPresetsMapService(): TestCategoryPresetMap
    {
        return $this->getPsrContainer()->get(TestCategoryPresetMap::class);
    }

    private function mapXmlExceptionMessage(XmlStorageException $exception): string
    {
        if (
            stristr(
                $exception->getMessage(),
                'An error occurred while unreferencing item reference with identifier'
            ) !== false
        ) {
            return __(
                'It seems that some items have been deleted. ' .
                'Please remove the items with empty labels from the test and save before trying again.'
            );
        }
        return $exception->getMessage();
    }
}
