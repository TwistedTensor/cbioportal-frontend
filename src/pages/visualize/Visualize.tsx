import * as React from 'react';
import {observer} from 'mobx-react';
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import './styles.scss';
import Helmet from "react-helmet";

@observer
export default class Visualize extends React.Component<{}, {}> {

    public render() {

        return <PageLayout className={'whiteBackground'}>
            <Helmet>
                <title>{'cBioPortal for Cancer Genomics::Visualize Your Data'}</title>
            </Helmet>

            <h1>Visualise Your Data</h1>
            <p>If you want to visualize your own data in cBioPortal, you have the following options:</p>
            <h3 id="we-host-data-for-you-academic-use">We host data for you (academic use)</h3>
            <ul>
                <li><b>MSKCC users can send us their data by filling out this <a href="https://docs.google.com/forms/d/1UPQF-T9HQStHK87UEYzgf-hTiKT-ok6fZDxxw_lANr8/viewform">form</a>.</b></li>
                <li>Public data will be available to everyone. Suggestions on data sets are welcome. Please <a href="mailto:cbioportal@cbio.mskcc.org?subject=Uploading public data">contact us</a> for details.</li>
                <li>Private data will be accessible by you and your collaborators. Please <a href="mailto:cbioportal@cbio.mskcc.org?subject=Uploading private data">contact us</a> for details.</li>
            </ul>
            <h3 id="use-our-tools-to-visualize-your-data">Use our tools to visualize your data</h3>
            <ul>
                <li><a href="oncoprinter.jsp">Oncoprinter</a> lets you create Oncoprints from your own, custom data.</li>
                <li><a href="mutation_mapper.jsp">MutationMapper</a> draws mutation diagrams (lollipop plots) from your custom data.</li>
            </ul>
            <h3 id="download-and-install-a-local-version-of-cbioportal">Download and install a local version of cBioPortal</h3>
            <ul>
                <li>The source code of cBioPortal is available on <a href="https://github.com/cBioPortal/cbioportal">GitHub</a> under the terms of Affero GPL V3. </li>
                <li>Please note that, installing a local version requires system administration skills, for example, installing and configuring Tomcat and MySQL. With limit resources, we cannot provide technical support on system administration.</li>
            </ul>

            <hr/>

            <p>For any questions, please contact us at <a href="mailto:cbioportal@cbio.mskcc.org?subject=Questions about downloading software or hosting data">cbioportal@cbio.mskcc.org</a>.</p>



        </PageLayout>

    }

}




