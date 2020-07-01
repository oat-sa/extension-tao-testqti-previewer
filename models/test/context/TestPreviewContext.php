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

namespace oat\taoQtiTestPreviewer\models\test\context;

use oat\libCat\CatSession;
use oat\taoQtiTest\models\runner\config\RunnerConfig;
use oat\taoQtiTest\models\runner\QtiRunnerServiceContext;
use oat\taoQtiTestPreviewer\models\test\session\TestPreviewSession;
use oat\taoQtiTestPreviewer\models\test\session\TestPreviewSessionManager;
use oat\taoQtiTestPreviewer\models\test\session\TestPreviewSessionStorage;
use qtism\data\AssessmentItemRef;
use qtism\data\AssessmentTest;
use qtism\runtime\tests\RouteItem;

class TestPreviewContext extends QtiRunnerServiceContext
{
    /** @var AssessmentTest */
    private $assessmentTest;

    public function __construct(AssessmentTest $assessmentTest)
    {
        $this->assessmentTest = $assessmentTest;

        parent::setSyncingMode(false);
    }

    /**
     * @return TestPreviewSessionStorage
     */
    public function getStorage()
    {
        return new TestPreviewSessionStorage();
    }

    /**
     * @inheritDoc
     */
    public function getTestConfig()
    {
        return $this->testConfig;
    }

    /**
     * @inheritDoc
     */
    public function setTestConfig(RunnerConfig $testConfig)
    {
        $this->testConfig = $testConfig;
    }

    /**
     * @inheritDoc
     */
    public function getItemIndex($id)
    {
        return null;
    }

    /**
     * @inheritDoc
     */
    public function getItemIndexValue($id, $name)
    {
        return null;
    }

    /**
     * @inheritDoc
     */
    public function canMoveBackward()
    {
        return true;
    }

    /**
     * @inheritDoc
     */
    public function getTestMeta()
    {
        return [
            'preConditions' => false,
            'branchRules' => false,
        ];
    }

    /**
     * @inheritDoc
     */
    public function getTestSession()
    {
        if (!$this->testSession) {
            $manager = new TestPreviewSessionManager();

            $this->testSession = new TestPreviewSession($manager, $this->assessmentTest);
        }

        return $this->testSession;
    }

    /**
     * @inheritDoc
     */
    public function getTestDefinition()
    {
        return $this->assessmentTest;
    }

    /**
     * @inheritDoc
     */
    public function init()
    {
    }

    /**
     * @inheritDoc
     */
    public function setTestSession($testSession)
    {
        $this->testSession = $testSession;
    }

    /**
     * @inheritDoc
     */
    public function getSessionManager()
    {
        return $this->sessionManager;
    }

    /**
     * @inheritDoc
     */
    public function getCompilationDirectory()
    {
        if (null === $this->compilationDirectory) {
            $this->initCompilationDirectory();
        }

        return $this->compilationDirectory;
    }

    /**
     * @inheritDoc
     */
    public function getTestDefinitionUri()
    {
        return null;
    }

    /**
     * @inheritDoc
     */
    public function getTestCompilationUri()
    {
        return null;
    }

    /**
     * @inheritDoc
     */
    public function getTestExecutionUri()
    {
        return null;
    }

    /**
     * @inheritDoc
     */
    public function getUserUri()
    {
        return null;
    }

    /**
     * @inheritDoc
     */
    public function setUserUri($userUri)
    {
    }

    /**
     * @inheritDoc
     */
    public function getCatEngine(RouteItem $routeItem = null)
    {
    }

    /**
     * @inheritDoc
     */
    public function getCatSession(RouteItem $routeItem = null)
    {
    }

    /**
     * @inheritDoc
     */
    public function persistCatSession($catSession, RouteItem $routeItem = null)
    {
    }

    /**
     * @inheritDoc
     */
    public function persistSeenCatItemIds($seenCatItemId)
    {
    }

    /**
     * @inheritDoc
     */
    public function getLastCatItemOutput()
    {
    }

    /**
     * @inheritDoc
     */
    public function persistLastCatItemOutput(array $lastCatItemOutput)
    {
    }

    /**
     * @inheritDoc
     */
    public function getCatSection(RouteItem $routeItem = null)
    {
        return false;
    }

    /**
     * @inheritDoc
     */
    public function isAdaptive(AssessmentItemRef $currentAssessmentItemRef = null)
    {
        return false;
    }

    /**
     * @inheritDoc
     */
    public function containsAdaptive()
    {
        return false;
    }

    /**
     * @inheritDoc
     */
    public function selectAdaptiveNextItem()
    {
    }

    /**
     * @inheritDoc
     */
    public function getCurrentAssessmentItemRef()
    {
        return parent::getCurrentAssessmentItemRef();
    }

    /**
     * @inheritDoc
     */
    public function getPreviouslySeenCatItemIds(RouteItem $routeItem = null)
    {
    }

    /**
     * @inheritDoc
     */
    public function getShadowTest(RouteItem $routeItem = null)
    {
    }

    /**
     * @inheritDoc
     */
    public function getCurrentCatItemId(RouteItem $routeItem = null)
    {
    }

    /**
     * @inheritDoc
     */
    public function persistCurrentCatItemId($catItemId)
    {
    }

    /**
     * @inheritDoc
     */
    public function getItemPositionInRoute($refId, &$catItemId = '')
    {
    }

    /**
     * @inheritDoc
     */
    public function getCurrentPosition()
    {
        return 0;
    }

    /**
     * @inheritDoc
     */
    public function getCatAttempts($identifier, RouteItem $routeItem = null)
    {
    }

    /**
     * @inheritDoc
     */
    public function persistCatAttempts($identifier, $attempts)
    {
    }

    /**
     * @inheritDoc
     */
    public function isSyncingMode()
    {
        return true;
    }

    /**
     * @inheritDoc
     */
    public function setSyncingMode($syncing)
    {
    }

    /**
     * @inheritDoc
     */
    protected function initTestSession()
    {
    }

    /**
     * @inheritDoc
     */
    protected function retrieveTestMeta()
    {
    }

    /**
     * @inheritDoc
     */
    protected function initCompilationDirectory()
    {
        $fileStorage = \tao_models_classes_service_FileStorage::singleton();
        $directoryIds = explode('|', $this->getTestCompilationUri());
        $directories = [
            'private' => $fileStorage->getDirectoryById($directoryIds[0]),
            'public' => $fileStorage->getDirectoryById($directoryIds[1])
        ];

        $this->compilationDirectory = $directories;
    }

    /**
     * @inheritDoc
     */
    protected function initTestDefinition()
    {
    }

    /**
     * @inheritDoc
     */
    protected function initStorage()
    {
    }

    /**
     * @inheritDoc
     */
    protected function retrieveItemIndex()
    {
    }

    /**
     * @inheritDoc
     */
    protected function saveAdaptiveResults(CatSession $catSession)
    {
    }

    /**
     * @inheritDoc
     */
    protected function storeResult(array $results)
    {
    }

    /**
     * @throws
     */
    protected function convertCatVariables(array $variables)
    {
    }

    /**
     * @inheritDoc
     */
    protected function getItemUriFromRefId($itemId)
    {
    }

    /**
     * @inheritDoc
     */
    protected function getEventManager()
    {
    }
}
