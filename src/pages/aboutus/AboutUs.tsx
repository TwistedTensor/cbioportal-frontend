import * as React from 'react';
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import './styles.scss';
import AppConfig from "appConfig";
import StaticContent from "../../shared/components/staticContent/StaticContent";
import Helmet from "react-helmet";

export default class AboutUs extends React.Component<{}, {}> {

    public render() {
        return <PageLayout className={'whiteBackground'}>
            <Helmet>
                <title>{'cBioPortal for Cancer Genomics::About Us'}</title>
            </Helmet>
            <StaticContent sourceUrl={AppConfig.skinAboutSourceURL!} title={"About Us"}/>
        </PageLayout>
    }

}




