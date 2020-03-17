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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA;
 */

namespace oat\taoQtiTestPreviewer\test\unit\models;

use oat\generis\test\MockObject;
use oat\generis\test\TestCase;
use oat\oatbox\user\User;
use oat\oatbox\user\UserLanguageService;
use oat\taoQtiTestPreviewer\models\PreviewLanguageService;
use oat\taoResultServer\models\classes\implementation\ResultServerService;
use oat\taoResultServer\models\classes\ResultStorageInterface;
use tao_models_classes_UserService;

class PreviewLanguageServiceTest extends TestCase
{
    /** @var UserLanguageService|MockObject  */
    private $userLanguageServiceMock;

    /** @var ResultServerService|MockObject */
    private $resultServerServiceMock;

    /** @var tao_models_classes_UserService|MockObject */
    private $userServiceMock;

    /** @var PreviewLanguageService */
    private $subject;

    protected function setUp(): void
    {
        $this->userLanguageServiceMock = $this->createMock(UserLanguageService::class);
        $this->resultServerServiceMock = $this->createMock(ResultServerService::class);
        $this->userServiceMock = $this->createMock(tao_models_classes_UserService::class);

        $this->subject = new PreviewLanguageService();
        $this->subject->setServiceLocator($this->getServiceLocator());
    }

    public function testItReturnsDataLanguageProperly()
    {
        $resultStorageMock = $this->createMock(ResultStorageInterface::class);

        $resultStorageMock
            ->expects($this->once())
            ->method('getTestTaker')
            ->with('resultId')
            ->willReturn('userId');

        $this->resultServerServiceMock
            ->expects($this->once())
            ->method('getResultStorage')
            ->with('deliveryUri')
            ->willReturn($resultStorageMock);

        $userMock = $this->createMock(User::class);

        $this->userServiceMock
            ->expects($this->once())
            ->method('getUserById')
            ->with('userId')
            ->willReturn($userMock);

        $this->userLanguageServiceMock
            ->expects($this->once())
            ->method('getDataLanguage')
            ->with($userMock)
            ->willReturn('dataLanguage');

        $previewLanguage = $this->subject->getPreviewLanguage('deliveryUri', 'resultId');
        $this->assertSame('dataLanguage', $previewLanguage);
    }

    private function getServiceLocator()
    {
        return $this->getServiceLocatorMock([
            UserLanguageService::class => $this->userLanguageServiceMock,
            ResultServerService::SERVICE_ID => $this->resultServerServiceMock,
            tao_models_classes_UserService::SERVICE_ID => $this->userServiceMock
        ]);
    }
}
