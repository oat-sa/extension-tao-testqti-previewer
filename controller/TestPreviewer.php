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

use oat\tao\model\http\HttpJsonResponseTrait;
use tao_actions_ServiceModule;
use taoQtiTest_helpers_TestRunnerUtils;

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
        $arr = '{"success":true,"testData":{"title":"Evgenia QA 11","identifier":"Evgenia-QA-11","className":"assessmentTest","toolName":"tao","exclusivelyLinear":true,"hasTimeLimits":false,"states":{"initial":0,"interacting":1,"modalFeedback":2,"suspended":3,"closed":4},"itemStates":{"initial":0,"interacting":1,"modalFeedback":2,"suspended":3,"closed":4,"solution":5,"review":6,"notSelected":255},"config":{"timerWarning":{"assessmentItemRef":null,"assessmentSection":null,"testPart":null,"assessmentTest":null},"timerWarningForScreenreader":null,"catEngineWarning":null,"progressIndicator":{"type":"percentage","renderer":"percentage","scope":"test","forced":false,"showLabel":true,"showTotal":true,"categories":[]},"review":{"enabled":true,"scope":"test","useTitle":true,"forceTitle":false,"forceInformationalTitle":false,"showLegend":true,"defaultOpen":true,"itemTitle":"Item %d","informationalItemTitle":"Instructions","preventsUnseen":true,"canCollapse":false,"displaySubsectionTitle":true,"allowSkipahead":false},"exitButton":false,"nextSection":false,"plugins":{"answer-masking":{"restoreStateOnToggle":true,"restoreStateOnMove":true},"validateResponses":{"validateOnPreviousMove":true},"overlay":{"full":false},"collapser":{"collapseTools":true,"collapseNavigation":false,"collapseInOrder":false,"hover":false,"collapseOrder":[]},"magnifier":{"zoomMin":2,"zoomMax":8,"zoomStep":0.5},"calculator":{"template":"","degree":true},"dialog":{"alert":{"focus":"navigable-modal-body"},"confirm":{"focus":"navigable-modal-body"}},"keyNavigation":{"contentNavigatorType":"default"}},"security":{"csrfToken":true},"timer":{"target":"server","resetAfterResume":false,"keepUpToTimeout":false,"restoreTimerFromClient":false},"enableAllowSkipping":true,"enableValidateResponses":true,"checkInformational":true,"enableUnansweredItemsWarning":true,"allowShortcuts":true,"shortcuts":{"calculator":{"toggle":"C"},"zoom":{"in":"I","out":"O"},"comment":{"toggle":"A"},"itemThemeSwitcher":{"toggle":"T"},"review":{"toggle":"R","flag":"M"},"keyNavigation":{"previous":"Shift+Tab","next":"Tab"},"next":{"trigger":"J","triggerAccessibility":"Alt+Shift+N"},"previous":{"trigger":"K","triggerAccessibility":"Alt+Shift+P"},"dialog":[],"magnifier":{"toggle":"L","in":"Shift+I","out":"Shift+O","close":"esc"},"highlighter":{"toggle":"Shift+U"},"area-masking":{"toggle":"Y"},"line-reader":{"toggle":"G"},"answer-masking":{"toggle":"D"},"apiptts":{"enterTogglePlayback":"Enter","togglePlayback":"P","spaceTogglePlayback":"Space"},"jumplinks":{"goToQuestion":"Alt+Shift+Q","goToTop":"Alt+Shift+T"}},"itemCaching":{"enabled":false,"amount":3},"guidedNavigation":false,"toolStateServerStorage":[],"forceEnableLinearNextItemWarning":false,"enableLinearNextItemWarningCheckbox":true}},"testContext":{"state":1,"navigationMode":0,"submissionMode":0,"remainingAttempts":-1,"isAdaptive":false,"isLinear":true,"isTimeout":false,"itemIdentifier":"item-1","attempt":1,"itemSessionState":1,"isCatAdaptive":false,"needMapUpdate":false,"isLast":false,"itemPosition":0,"itemFlagged":false,"itemAnswered":true,"timeConstraints":[],"testPartId":"testPart-1","sectionId":"assessmentSection-1","sectionTitle":"Section 1","numberItems":2,"numberCompleted":0,"numberPresented":1,"considerProgress":true,"isDeepestSectionVisible":true,"canMoveBackward":false,"numberRubrics":0,"enableAllowSkipping":true,"allowSkipping":true,"enableValidateResponses":true,"validateResponses":false,"hasFeedbacks":false,"options":{"allowComment":false,"allowSkipping":true,"exitButton":false,"logoutButton":true,"validateResponses":false,"sectionPause":false}},"testMap":{"scope":"test","parts":{"testPart-1":{"id":"testPart-1","label":"testPart-1","position":0,"isLinear":true,"sections":{"assessmentSection-1":{"id":"assessmentSection-1","label":"Section 1","isCatAdaptive":false,"position":0,"timeConstraint":null,"items":{"item-1":{"id":"item-1","label":"Evgenia QA_3 1 file upload","position":0,"occurrence":0,"remainingAttempts":-1,"answered":true,"flagged":false,"viewed":true,"categories":["x-tao-scoring-new"],"informational":false},"item-2":{"id":"item-2","label":"Evgenia QA_3 choice","position":1,"occurrence":0,"remainingAttempts":-1,"answered":false,"flagged":false,"viewed":false,"categories":["x-tao-scoring-new"],"informational":false}},"stats":{"questions":2,"answered":1,"flagged":0,"viewed":1,"total":2,"questionsViewed":1}}},"stats":{"questions":2,"answered":1,"flagged":0,"viewed":1,"total":2,"questionsViewed":1}}},"title":"Evgenia QA 11","identifier":"Evgenia-QA-11","className":"assessmentTest","toolName":"tao","exclusivelyLinear":true,"hasTimeLimits":false,"stats":{"questions":2,"answered":1,"flagged":0,"viewed":1,"total":2,"questionsViewed":1}},"toolStates":[],"lastStoreId":false,"messages":[]}';
        $this->setSuccessJsonResponse(json_decode($arr));
    }

    public function getItem()
    {
        $this->setSuccessJsonResponse([]);
    }
}
