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

use core_kernel_users_GenerisUser;
use oat\generis\model\GenerisRdf;
use oat\generis\test\MockObject;
use oat\generis\test\TestCase;
use oat\oatbox\user\UserLanguageService;
use oat\taoQtiTestPreviewer\models\TestTakerService;
use oat\taoQtiTestPreviewer\models\PreviewLanguageService;

class PreviewLanguageServiceTest extends TestCase
{
    /** @var UserLanguageService|MockObject  */
    private $userLanguageServiceMock;

    /** * @var TestTakerService|MockObject */
    private $testTakerServiceMock;

    /** * @var PreviewLanguageService */
    private $subject;

    protected function setUp()
    {
        $this->userLanguageServiceMock = $this->createMock(UserLanguageService::class);
        $this->testTakerServiceMock = $this->createMock(TestTakerService::class);

        $this->subject = new PreviewLanguageService();
        $this->subject->setServiceLocator($this->getServiceLocator());
    }

    public function testItReturnsDataLanguageIfItEnabled()
    {
        $this->userLanguageServiceMock
            ->expects($this->once())
            ->method('isDataLanguageEnabled')
            ->willReturn(true);

        $this->userLanguageServiceMock
            ->expects($this->once())
            ->method('getDefaultLanguage')
            ->willReturn('default-LANG');

        $this->assertSame('default-LANG', $this->subject->getPreviewLanguage('deliveryUri', 'resultId'));
    }

    public function testItReturnsUserInterfaceLanguageIfDataLanguageDisabled()
    {
        $this->userLanguageServiceMock
            ->expects($this->once())
            ->method('isDataLanguageEnabled')
            ->willReturn(false);

        $this->userLanguageServiceMock
            ->expects($this->never())
            ->method('getDefaultLanguage');

        $this->setTestTakerInterfaceLanguages(['tt-LANG'], 'resultId', 'deliveryUri');

        $this->assertSame('tt-LANG', $this->subject->getPreviewLanguage('deliveryUri', 'resultId'));
    }

    public function testItReturnsDefaultLanguageIfNoUserInterfaceLanguageSet()
    {
        $this->userLanguageServiceMock
            ->expects($this->once())
            ->method('isDataLanguageEnabled')
            ->willReturn(false);

        $this->setTestTakerInterfaceLanguages([], 'resultId', 'deliveryUri');

        $this->userLanguageServiceMock
            ->expects($this->once())
            ->method('getDefaultLanguage')
            ->willReturn('default-LANG');

        $this->assertSame('default-LANG', $this->subject->getPreviewLanguage('deliveryUri', 'resultId'));
    }

    private function setTestTakerInterfaceLanguages($languages, $resultId, $deliveryUri)
    {
        $generisUserMock = $this->createMock(core_kernel_users_GenerisUser::class);

        $generisUserMock
            ->expects($this->once())
            ->method('getPropertyValues')
            ->with(GenerisRdf::PROPERTY_USER_DEFLG)
            ->willReturn($languages);

        $this->testTakerServiceMock
            ->expects($this->once())
            ->method('getGenerisUser')
            ->with($deliveryUri, $resultId)
            ->willReturn($generisUserMock);
    }

    private function getServiceLocator()
    {
        return $this->getServiceLocatorMock([
            UserLanguageService::class => $this->userLanguageServiceMock,
            TestTakerService::class => $this->testTakerServiceMock
        ]);
    }
}
