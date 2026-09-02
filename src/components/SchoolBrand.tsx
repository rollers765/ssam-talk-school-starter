import { MessageCircleHeart } from "lucide-react";
import { SCHOOL_NAME } from "../lib/siteConfig";
import { schoolConfig } from "../lib/schoolConfig";

export function SchoolBrand() {
  return <div className="school-brand"><div className="school-identity"><span className="school-emblem-crop"><img className="school-emblem" src={schoolConfig.school.logoPath} alt={`${SCHOOL_NAME} 교표`} /></span><span>{SCHOOL_NAME}</span></div><div className="ssam-identity"><div className="brand-mark small"><MessageCircleHeart /></div><span><b>{schoolConfig.branding.appName}</b><small>{schoolConfig.branding.tagline}</small></span></div></div>;
}
