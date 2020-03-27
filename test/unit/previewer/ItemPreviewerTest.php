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

namespace oat\taoQtiTestPreviewer\test\unit\previewer;

use core_kernel_classes_Resource;
use oat\generis\test\MockObject;
use oat\generis\test\TestCase;
use oat\oatbox\filesystem\File;
use oat\taoQtiTest\models\container\QtiTestDeliveryContainer;
use tao_models_classes_service_FileStorage as FileStorage;
use oat\taoDelivery\model\RuntimeService;
use oat\taoQtiTestPreviewer\models\ItemPreviewer;

class ItemPreviewerTest extends TestCase
{
    /**
     * @var MockObject|core_kernel_classes_Resource
     */
    private $deliveryMock;

    /**
     * @var MockObject|core_kernel_classes_Resource
     */
    private $failedDeliveryMock;

    /**
     * @var MockObject|RuntimeService
     */
    private $runtimeServiceMock;
    /**
     * @var MockObject|FileStorage
     */
    private $fileStorageMock;
    /**
     * @var MockObject
     */
    private $deliveryContainerMock;
    /**
     * @var MockObject
     */
    private $storageDirectoryMock;
    /**
     * @var MockObject
     */
    private $fileMock;
    /**
     * @var MockObject
     */
    private $fileMockJson;
    /**
     * @var MockObject
     */
    private $fileMockXML;


    public function setUp(): void
    {
        $this->deliveryMock = $this->createMock(core_kernel_classes_Resource::class);
        $this->deliveryMock->method('exists')->willReturn(true);
        $this->deliveryMock->method('getUri')->willReturn('https://delivery.uri#1');

        $this->failedDeliveryMock = $this->createMock(core_kernel_classes_Resource::class);
        $this->failedDeliveryMock->method('exists')->willReturn(false);

        $this->deliveryContainerMock = $this->createMock(QtiTestDeliveryContainer::class);
        $this->deliveryContainerMock->method('getRuntimeParams')->willReturn(['private' => '/test/private/path']);

        $this->runtimeServiceMock = $this->createMock(RuntimeService::class);
        $this->runtimeServiceMock->method('getDeliveryContainer')->willReturn($this->deliveryContainerMock);

        $this->fileMock = $this->createMock(File::class);
        $this->fileMock->method('read')->willReturn('https://uri#1|https://uri#2|https://uri#3');
        $this->fileMock->method('exists')->willReturn(true);

        $this->fileMockJson = $this->createMock(File::class);
        $this->fileMockJson->method('read')->willReturn('{"test": "test"}');
        $this->fileMockJson->method('exists')->willReturn(true);

        $this->fileMockXML = $this->createMock(File::class);

        $this->storageDirectoryMock = $this->createMock(\tao_models_classes_service_StorageDirectory::class);
        $this->storageDirectoryMock->method('getFile')->willReturnCallback(function ($parameter) {
            if ($parameter === 'assessment-item-ref-href-index-b7e1554ee4ffb6074f1e756e9284fda5.idx') {
                return $this->fileMock;
            }
            if ($parameter === 'en-EN/item.json') {
                return $this->fileMockJson;
            }
            if ($parameter === 'en-EN/qti.xml') {
                return $this->fileMockXML;
            }
            if ($parameter === 'en-EN/variableElements.json') {
                return $this->fileMockJson;
            }
            return $this->fileMock;
        });

        $this->fileStorageMock = $this->createMock(FileStorage::class);
        $this->fileStorageMock->method('getDirectoryById')->willReturn($this->storageDirectoryMock);
    }

    public function testLoadCompiledItemData()
    {
        $itemPreviewer = new ItemPreviewer();

        $itemPreviewer->setServiceLocator($this->getServiceLocator());
        $itemPreviewer->setUserLanguage('en-EN');
        $itemPreviewer->setItemDefinition('https://item.uri#1');
        $itemPreviewer->setDelivery($this->deliveryMock);

        $this->assertEquals($itemPreviewer->loadCompiledItemData(), ['test' => 'test']);
    }

    public function testLoadCompiledItemDataFailedDelivery()
    {
        $this->expectException(\common_exception_NotFound::class);

        $itemPreviewer = new ItemPreviewer();
        $itemPreviewer->setServiceLocator($this->getServiceLocator());
        $itemPreviewer->setUserLanguage('en-EN');
        $itemPreviewer->setItemDefinition('https://item.uri#1');

        $itemPreviewer->setDelivery($this->failedDeliveryMock);
    }

    public function testLoadCompiledItemVariables()
    {
        $itemPreviewer = new ItemPreviewer();
        $itemPreviewer->setServiceLocator($this->getServiceLocator());
        $itemPreviewer->setUserLanguage('en-EN');
        $itemPreviewer->setItemDefinition('https://item.uri#1');
        $itemPreviewer->setDelivery($this->deliveryMock);

        $this->assertEquals($itemPreviewer->loadCompiledItemVariables(), ['test' => 'test']);
    }

    private function getServiceLocator($services = [])
    {
        return $this->getServiceLocatorMock(array_merge($services, [
            RuntimeService::SERVICE_ID => $this->runtimeServiceMock,
            FileStorage::SERVICE_ID => $this->fileStorageMock,
        ]));
    }
}
